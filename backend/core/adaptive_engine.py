"""
core/adaptive_engine.py

FIX APPLIED:
  Bug #11: Steps had no "id" field — frontend routes to /topic/:stepId and
           uses steps.find(s => s.id === stepId), which always missed.
           Each step now gets a stable UUID.
  Bug #12: Steps were missing "type", "difficulty", "estimated_hours" fields
           that DashboardPage and TopicPage read. Reasonable defaults added.
"""

import uuid
from collections import Counter
from sqlalchemy.orm import Session

from core.skill_graph import SkillGraph

KNOWN_THRESHOLD = 0.80
WEAK_THRESHOLD  = 0.45


# ── Stage → difficulty mapping ────────────────────────────────────────────────
_STAGE_TO_DIFFICULTY = {
    "Foundational": "beginner",
    "Intermediate":  "intermediate",
    "Advanced":      "advanced",
}

# ── Category → estimated hours heuristic ─────────────────────────────────────
_CATEGORY_HOURS = {
    "programming_language": 8,
    "ml_ai":                6,
    "data":                 5,
    "cloud":                4,
    "devops":               4,
    "framework":            5,
    "soft_skill":           2,
}
_DEFAULT_HOURS = 4


def _infer_type(category: str) -> str:
    """Heuristic: ML/AI → Video; others → Article."""
    video_categories = {"ml_ai", "programming_language", "framework"}
    return "Video" if category in video_categories else "Article"


# ── Pathway generation ────────────────────────────────────────────────────────
def generate_pathway(
    gap_skills: list[str],
    skill_graph: SkillGraph,
    knowledge_states: dict[str, float],
) -> list[dict]:
    """
    Build an ordered list of pathway steps from gap skills.

    1. Expand each gap skill to include missing prerequisites.
    2. Add unknown skills as leaf nodes to prevent crashes.
    3. Topological sort for correct learning order.
    4. Return steps with status, stage, category, knowledge_state,
       id (UUID), type, difficulty, estimated_hours.   ← FIX #11 #12
    """
    all_needed: set[str] = set()

    for skill in gap_skills:
        all_needed.add(skill)
        for prereq in skill_graph.get_prerequisites(skill):
            if knowledge_states.get(prereq, 0.0) < KNOWN_THRESHOLD:
                all_needed.add(prereq)

    for skill in list(all_needed):
        if skill not in skill_graph.nodes:
            skill_graph.add_leaf_node(skill)

    ordered = skill_graph.topological_order(list(all_needed))

    steps: list[dict] = []
    for i, skill in enumerate(ordered):
        stage    = skill_graph.assign_stage(skill)
        category = skill_graph.get_category(skill)
        steps.append({
            # FIX #11: stable UUID so frontend /topic/:stepId routing works
            "id":               str(uuid.uuid4()),
            "skill":            skill,
            "order":            i,
            "stage":            stage,
            "category":         category,
            "status":           "active" if i == 0 else "locked",
            "knowledge_state":  round(knowledge_states.get(skill, 0.0), 4),
            "resources":        [],
            "reasoning":        "",
            "latest_quiz_score": None,
            "quiz_attempts":    0,
            # FIX #12: fields read by DashboardPage and TopicPage
            "type":             _infer_type(category),
            "difficulty":       _STAGE_TO_DIFFICULTY.get(stage, "intermediate"),
            "estimated_hours":  _CATEGORY_HOURS.get(category, _DEFAULT_HOURS),
        })

    return steps


# ── Adaptive quiz outcome handler ─────────────────────────────────────────────
def update_pathway_after_quiz(
    user_id:      str,
    skill_id:     str,
    score:        float,
    questions:    list[dict],
    user_answers: list[str],   # NOTE: callers must use kwarg "user_answers="
    db:           Session,
) -> dict:
    """
    Apply PASS / REVISE / RETRY logic to the pathway after a quiz.
    Uses row-level locking to prevent race conditions.
    """
    from models.pathway import Pathway

    with db.begin():
        row = (
            db.query(Pathway)
            .filter(Pathway.user_id == user_id)
            .with_for_update()
            .first()
        )
        if row is None:
            raise ValueError(f"No pathway found for user {user_id}")

        pathway: list[dict] = row.steps

        step = _find_step(pathway, skill_id)
        if step is None:
            raise ValueError(f"Skill '{skill_id}' not in pathway for user {user_id}")

        step["latest_quiz_score"] = round(score, 4)
        step["quiz_attempts"]     = step.get("quiz_attempts", 0) + 1

        if score >= 0.70:
            step["status"] = "complete"
            nxt = _find_next_locked(pathway, step["order"])
            if nxt:
                nxt["status"] = "active"
            action      = "PASS"
            next_topic  = nxt["skill"] if nxt else None
            weak_subtopic = None
            message = (
                f"{skill_id} complete."
                + (f" {next_topic} is now unlocked." if next_topic else " You have finished the pathway!")
            )

        elif score >= 0.40:
            weak_subtopic = identify_weak_subtopics(questions, user_answers)
            step["status"] = "revise"
            action     = "REVISE"
            next_topic = skill_id
            message    = f"Score {int(score * 100)}%. Review: {weak_subtopic} before retaking."

        else:
            step["status"] = "retry"
            action        = "RETRY"
            next_topic    = skill_id
            weak_subtopic = None
            message       = f"Score {int(score * 100)}%. Simpler resources loaded. Try again."

        row.steps = pathway
        db.add(row)

    return {
        "action":        action,
        "message":       message,
        "next_topic":    next_topic,
        "weak_subtopic": weak_subtopic,
    }


# ── Weak subtopic identification ──────────────────────────────────────────────
def identify_weak_subtopics(questions: list[dict], user_answers: list[str]) -> str:
    wrong_subtopics = [
        q.get("subtopic", "general concept")
        for q, ans in zip(questions, user_answers)
        if ans != q.get("correct_answer")
    ]
    if not wrong_subtopics:
        return "general review"
    return Counter(wrong_subtopics).most_common(1)[0][0]


# ── Helpers ───────────────────────────────────────────────────────────────────
def _find_step(pathway: list[dict], skill_id: str) -> dict | None:
    for step in pathway:
        if step["skill"] == skill_id:
            return step
    return None


def _find_next_locked(pathway: list[dict], current_order: int) -> dict | None:
    candidates = [s for s in pathway if s["order"] > current_order and s["status"] == "locked"]
    if not candidates:
        return None
    return min(candidates, key=lambda s: s["order"])
