from sqlalchemy.orm import Session
from core import llm

MENTOR_SYSTEM = """You are SkillForge's AI learning mentor — a knowledgeable, direct, and highly specific tutor.

LEARNER CONTEXT:
- Role/Track: {role}
- Currently studying: {current_skill}
- Completed so far: {completed}
- Latest quiz score: {latest_score}
- Weak area identified: {weak_subtopic}
- Total pathway steps: {total_steps}
- Steps completed: {completed_count}/{total_steps}

RULES:
1. Always give DETAILED, specific answers — minimum 3-4 sentences, never one-liners
2. Reference the learner's actual pathway data (current topic, quiz scores, weak areas)
3. When explaining concepts, use concrete examples, code snippets, or analogies
4. If they ask about their progress, give specific numbers from their context
5. Suggest next actions tied to their actual pathway (e.g. "Since you're on {current_skill}, try...")
6. Never say "I don't have access to your data" — you DO have their context above
7. Format responses clearly — use bullet points or numbered steps when listing things
"""

MENTOR_PROMPT = """{history}

User: {message}

Mentor:"""


def chat(message: str, history: list[dict], user_id: str, db: Session) -> str:
    """
    Generate a context-aware mentor reply using LLaMA 3.1 via Groq.
    Falls back to smart stub if LLM fails.
    """
    profile      = _get_user_profile(user_id, db)
    pathway_ctx  = _get_pathway_context(user_id, db)

    system = MENTOR_SYSTEM.format(
        role            = profile.get("role", "tech professional"),
        current_skill   = pathway_ctx.get("current_skill", "your first topic"),
        completed       = ", ".join(pathway_ctx.get("completed", [])) or "none yet",
        latest_score    = _fmt_score(pathway_ctx.get("latest_score")),
        weak_subtopic   = pathway_ctx.get("weak_subtopic") or "none identified yet",
        total_steps     = pathway_ctx.get("total_steps", "?"),
        completed_count = len(pathway_ctx.get("completed", [])),
    )

    # Format last 6 messages as readable thread
    history_str = "\n".join(
        f"{'User' if h['role'] == 'user' else 'Mentor'}: {h['content']}"
        for h in history[-6:]
    )

    prompt = MENTOR_PROMPT.format(
        history = history_str,
        message = message,
    )

    try:
        response = llm.generate(prompt, system=system)
        if response and len(response.strip()) > 10:
            return response.strip()
    except Exception as e:
        print(f"[mentor] LLM failed: {e}")

    # Smart fallback using real pathway context
    return _smart_fallback(message, pathway_ctx, profile)


# ── DB helpers ────────────────────────────────────────────────────────────────

def _get_user_profile(user_id: str, db: Session) -> dict:
    from models.user import User
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {}
    return {"role": getattr(user, "role", "tech")}


def _get_pathway_context(user_id: str, db: Session) -> dict:
    from models.pathway import Pathway
    from models.quiz import QuizAttempt   # FIXED: removed wrong "backend." prefix

    pathway_row = db.query(Pathway).filter(Pathway.user_id == user_id).first()
    if not pathway_row or not pathway_row.steps:
        return {}

    steps     = pathway_row.steps
    completed = [s["skill"] for s in steps if s.get("status") == "complete"]

    active = next(
        (s for s in steps if s.get("status") in ("active", "revise", "retry")),
        None,
    )
    current_skill = active["skill"] if active else "all topics complete"

    # Get all quiz attempts for richer context
    all_attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == user_id)
        .order_by(QuizAttempt.attempted_at.desc())
        .all()
    )
    latest        = all_attempts[0] if all_attempts else None
    latest_score  = getattr(latest, "score", None)
    weak_subtopic = getattr(latest, "weak_subtopic", None)

    # Build score summary per skill
    score_summary = {}
    for a in all_attempts:
        if a.skill_id not in score_summary:
            score_summary[a.skill_id] = a.score

    return {
        "current_skill":  current_skill,
        "completed":      completed,
        "latest_score":   latest_score,
        "weak_subtopic":  weak_subtopic,
        "total_steps":    len(steps),
        "score_summary":  score_summary,
        "all_steps":      [s["skill"] for s in steps],
    }


def _fmt_score(score) -> str:
    if score is None:
        return "no quiz taken yet"
    return f"{int(score * 100)}%"


def _smart_fallback(message: str, ctx: dict, profile: dict) -> str:
    """
    Context-aware fallback when LLM is unavailable.
    Uses real pathway data to give useful responses.
    """
    m             = message.lower()
    current       = ctx.get("current_skill", "your current topic")
    completed     = ctx.get("completed", [])
    latest_score  = ctx.get("latest_score")
    weak_subtopic = ctx.get("weak_subtopic")
    total         = ctx.get("total_steps", 0)
    score_summary = ctx.get("score_summary", {})

    if any(w in m for w in ("progress", "how am i", "status", "far")):
        pct = round(len(completed) / total * 100) if total else 0
        scores_text = ""
        if score_summary:
            scores_text = "\n\nYour quiz scores so far:\n" + "\n".join(
                f"  • {skill}: {int(score*100)}%"
                for skill, score in score_summary.items()
            )
        return (
            f"Here's your current progress:\n\n"
            f"  • {len(completed)}/{total} modules complete ({pct}%)\n"
            f"  • Currently working on: {current}\n"
            f"  • Completed: {', '.join(completed) if completed else 'none yet'}\n"
            f"  • Latest quiz score: {_fmt_score(latest_score)}"
            f"{scores_text}\n\n"
            f"{'Great momentum! ' if pct > 50 else 'Keep going! '}"
            f"Focus on {current} next and take the quiz when you feel ready."
        )

    if any(w in m for w in ("quiz", "score", "test", "fail", "pass", "retry", "revise")):
        if latest_score is not None:
            action = "PASS ✓" if latest_score >= 0.7 else ("REVISE" if latest_score >= 0.4 else "RETRY")
            advice = ""
            if weak_subtopic:
                advice = f"\n\nYour weakest area is **{weak_subtopic}**. Focus specifically on this subtopic before retaking."
            elif latest_score < 0.4:
                advice = f"\n\nScore below 40% means go back to the basics of {current}. Check the beginner resources first."
            return (
                f"Your latest quiz result on {ctx.get('score_summary', {}).get(current, 'this topic') and current}:\n\n"
                f"  • Score: {int(latest_score*100)}% → {action}\n"
                f"  • Threshold: 70% to pass, 40-69% to revise, <40% to retry"
                f"{advice}\n\n"
                f"Tip: Don't just re-read — actively test yourself on the concepts you got wrong."
            )
        return (
            f"You haven't taken any quizzes yet!\n\n"
            f"To take a quiz on {current}:\n"
            f"  1. Go to your Pathway page\n"
            f"  2. Click on '{current}'\n"
            f"  3. Complete the resources, then click 'Take Quiz'\n\n"
            f"Scoring: 70%+ = PASS, 40-69% = REVISE, <40% = RETRY with easier resources."
        )

    if any(w in m for w in ("next", "after", "then", "what should")):
        all_steps = ctx.get("all_steps", [])
        remaining = [s for s in all_steps if s not in completed and s != current]
        upcoming  = remaining[:3] if remaining else []
        return (
            f"Your learning order is determined by skill dependencies (DAG).\n\n"
            f"  • Right now: **{current}**\n"
            f"  • Up next: {', '.join(upcoming) if upcoming else 'this is your last step!'}\n\n"
            f"Complete {current} → take the quiz → score 70%+ → next topic unlocks automatically.\n\n"
            f"{'You have ' + str(len(remaining)) + ' topics remaining.' if remaining else 'Almost done!'}"
        )

    if any(w in m for w in ("explain", "what is", "how does", "tell me about", "help me understand")):
        return (
            f"Great question about {current}!\n\n"
            f"Since you're currently working on **{current}**, here's how I'd approach understanding it:\n\n"
            f"  1. Start with the 'why' — what problem does {current} solve?\n"
            f"  2. Learn the core concepts (check your Topic page resources)\n"
            f"  3. Build something small with it — hands-on practice beats reading\n"
            f"  4. Take the quiz to verify your understanding\n\n"
            f"{'Your weak area is ' + weak_subtopic + ' — focus there specifically.' if weak_subtopic else 'Check the resources on your Topic page for curated materials.'}"
        )

    if any(w in m for w in ("resource", "course", "learn", "study", "material")):
        return (
            f"For **{current}**, check your Topic page — it has curated resources ranked by relevance to your skill gap.\n\n"
            f"General tips:\n"
            f"  • Watch/read each resource completely before marking done\n"
            f"  • Take notes on concepts you find hard\n"
            f"  • The quiz tests specific subtopics, not just general knowledge\n"
            f"{'  • Pay extra attention to ' + weak_subtopic + ' — that was your weak area last quiz.' if weak_subtopic else ''}\n\n"
            f"Once you finish the resources, the 'Take Quiz' button unlocks."
        )

    # Default — still contextual
    return (
        f"I'm your SkillForge mentor, and I have full context on your pathway.\n\n"
        f"  • You're currently on: **{current}**\n"
        f"  • Progress: {len(completed)}/{total} modules done\n"
        f"  • Latest score: {_fmt_score(latest_score)}\n\n"
        f"Ask me about:\n"
        f"  • Your quiz scores and what to improve\n"
        f"  • Explaining concepts in {current}\n"
        f"  • What's coming next in your pathway\n"
        f"  • Study strategies for your weak areas"
    )
