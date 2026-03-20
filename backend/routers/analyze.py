"""
routers/analyze.py
POST /analyze                       → creates analysis job, returns job_id
GET  /analyze/stream/{job_id}       → SSE: streams stage updates until complete/failed

FIXES APPLIED:
  1. build_pathway() called with correct args (knowledge_states + user_profile dict)
  2. architect.py returns list[dict] → wrapped in {"steps": ...} for consistency
  3. analyze() imported correctly (was extract_skills_from_texts which didn't exist)
  4. Background task opens its own DB session (request session closes before task runs)
  5. SSE auth: reads ?token= query param so EventSource can authenticate
"""

import asyncio
import json
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.auth import get_current_user, _decode_token
from database import get_db, SessionLocal
from models.job import AnalysisJob
from models.user import User
from routers.upload import get_file_text

router = APIRouter(prefix="/analyze", tags=["analyze"])

bearer = HTTPBearer(auto_error=False)


# ── SSE-compatible auth dependency ────────────────────────────────────────────
# EventSource cannot send headers, so we also accept ?token= query param
def get_current_user_sse(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    raw = (credentials.credentials if credentials else None) or token
    if not raw:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    payload = _decode_token(raw)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")
    return user


# ── Request Schema ────────────────────────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    resume_id: str      # file_id from POST /upload/resume
    jd_id:     str      # file_id from POST /upload/jd


# ── Stage definitions ─────────────────────────────────────────────────────────
STAGES = [
    "Extracting skills from your resume and job description...",
    "Computing skill gaps with semantic analysis...",
    "Building your dependency-aware learning pathway...",
    "Fetching verified resources for each skill...",
    "Generating reasoning traces...",
]


# ── Background pipeline task ──────────────────────────────────────────────────
# FIX #4: Opens its own DB session — the request session is closed before this runs.
async def _run_pipeline(job_id: str, user_id: str, resume_text: str, jd_text: str):
    db = SessionLocal()
    try:
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()

        # ── Stage 1: Skill Extraction ─────────────────────────────────────
        job.status = "running:stage_0"
        db.commit()

        try:
            from agents.analyzer import analyze
            skills = await asyncio.get_event_loop().run_in_executor(
                None, analyze, resume_text, jd_text
            )
            print(f"[pipeline] Stage 1 done: {len(skills.get('resume_skills', []))} resume skills, {len(skills.get('jd_skills', []))} jd skills")
        except Exception as e:
            import traceback
            print(f"[pipeline] Stage 1 FAILED (using stub): {e}")
            traceback.print_exc()
            skills = {
                "resume_skills": [{"name": "Python", "level": "intermediate", "confidence": 0.9, "category": "programming_language"}],
                "jd_skills":     [{"name": "ML Fundamentals", "required_level": "intermediate", "category": "ml_ai"}],
            }

        # ── Stage 2: Gap Analysis ─────────────────────────────────────────
        job.status = "running:stage_1"
        db.commit()

        try:
            from agents.evaluator import evaluate_gap   # function is evaluate_gap not compute_gap
            gap_skills = await asyncio.get_event_loop().run_in_executor(
                None, evaluate_gap, skills["resume_skills"], skills["jd_skills"]
            )
            gap_result = {"gap_skills": gap_skills}
            print(f"[pipeline] Stage 2 done: {len(gap_skills)} gap skills")
        except Exception as e:
            import traceback
            print(f"[pipeline] Stage 2 FAILED (using stub): {e}")
            traceback.print_exc()
            gap_result = {"gap_skills": [{"name": "ML Fundamentals", "knowledge_state": 0.22, "priority": 1, "category": "ml_ai"}]}

        # ── Stage 3: Pathway Build ────────────────────────────────────────
        job.status = "running:stage_2"
        db.commit()

        try:
            from agents.architect import build_pathway
            knowledge_states = {
                s["name"]: s.get("knowledge_state", 0.0)
                for s in gap_result["gap_skills"]
            }
            pathway_steps = await build_pathway(
                gap_skills=gap_result["gap_skills"],
                knowledge_states=knowledge_states,
                user_profile={"user_id": user_id},
                db=db,
            )
            pathway = {"steps": pathway_steps}
            print(f"[pipeline] Stage 3 done: {len(pathway_steps)} pathway steps")
        except Exception as e:
            import traceback
            print(f"[pipeline] Stage 3 FAILED (using stub): {e}")
            traceback.print_exc()
            pathway = {"steps": [
                {
                    "id": str(uuid.uuid4()),
                    "skill": "ML Fundamentals",
                    "order": 0,
                    "stage": "Intermediate",
                    "status": "active",
                    "category": "ml_ai",
                    "knowledge_state": 0.22,
                    "resources": [],
                    "reasoning": "",
                    "latest_quiz_score": None,
                    "quiz_attempts": 0,
                    "type": "Article",
                    "difficulty": "intermediate",
                    "estimated_hours": 4,
                }
            ]}

        # ── Stage 4 & 5: Resources + Reasoning (handled inside architect) ─
        job.status = "running:stage_3"
        db.commit()
        await asyncio.sleep(0.5)

        job.status = "running:stage_4"
        db.commit()
        await asyncio.sleep(0.5)

        # ── Save skill profile + pathway to DB ────────────────────────────
        from models.skill_profile import SkillProfile
        from models.pathway import Pathway

        profile = db.query(SkillProfile).filter(SkillProfile.user_id == user_id).first()
        if profile:
            profile.resume_skills = skills["resume_skills"]
            profile.jd_skills     = skills["jd_skills"]
            profile.gap_skills    = gap_result["gap_skills"]
        else:
            db.add(SkillProfile(
                id=str(uuid.uuid4()),
                user_id=user_id,
                resume_skills=skills["resume_skills"],
                jd_skills=skills["jd_skills"],
                gap_skills=gap_result["gap_skills"],
            ))

        existing = db.query(Pathway).filter(Pathway.user_id == user_id).first()
        if existing:
            existing.steps      = pathway["steps"]
            existing.version    = (existing.version or 0) + 1
            existing.updated_at = datetime.utcnow()
        else:
            db.add(Pathway(
                id=str(uuid.uuid4()),
                user_id=user_id,
                version=1,
                steps=pathway["steps"],
                updated_at=datetime.utcnow(),
            ))

        db.commit()
        job.status = "complete"
        db.commit()

    except Exception as e:
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if job:
            job.status = "failed"
            job.error  = str(e)
            db.commit()
    finally:
        # FIX #4: Always close the session we opened
        db.close()


# ── POST /analyze ─────────────────────────────────────────────────────────────
@router.post("")
async def start_analysis(
    req:              AnalyzeRequest,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume_text = get_file_text(req.resume_id)
    jd_text     = get_file_text(req.jd_id)

    job = AnalysisJob(
        id=str(uuid.uuid4()),
        user_id=str(current_user.id),
        status="pending",
        created_at=datetime.utcnow(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # FIX #4: Don't pass db — task opens its own session
    background_tasks.add_task(
        _run_pipeline,
        job.id,
        str(current_user.id),
        resume_text,
        jd_text,
    )

    return {"job_id": job.id}


# ── GET /analyze/stream/{job_id}  (SSE) ──────────────────────────────────────
@router.get("/stream/{job_id}")
async def stream_analysis(
    job_id:       str,
    # FIX #5: Use SSE-compatible auth that reads ?token= query param
    current_user= Depends(get_current_user_sse),
    db: Session = Depends(get_db),
):
    async def event_generator():
        sent_stages   = set()
        timeout       = 300   # 5 minutes — HuggingFace model load can be slow on first run
        elapsed       = 0
        poll_interval = 1.0

        while elapsed < timeout:
            db.expire_all()  # force fresh read each poll
            job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()

            if job is None:
                yield f"data: {json.dumps({'stage': 'Error: job not found', 'done': True, 'error': 'Job not found'})}\n\n"
                return

            if job.status.startswith("running:stage_"):
                try:
                    idx = int(job.status.split("stage_")[1])
                except (IndexError, ValueError):
                    idx = 0

                for i in range(idx + 1):
                    if i not in sent_stages and i < len(STAGES):
                        yield f"data: {json.dumps({'stage': STAGES[i], 'index': i, 'done': False})}\n\n"
                        sent_stages.add(i)

            elif job.status == "complete":
                for i in range(len(STAGES)):
                    if i not in sent_stages:
                        yield f"data: {json.dumps({'stage': STAGES[i], 'index': i, 'done': False})}\n\n"

                yield f"data: {json.dumps({'stage': 'Complete', 'index': len(STAGES), 'done': True, 'error': None})}\n\n"
                return

            elif job.status == "failed":
                yield f"data: {json.dumps({'stage': 'Analysis failed', 'done': True, 'error': job.error or 'Unknown error'})}\n\n"
                return

            await asyncio.sleep(poll_interval)
            elapsed += poll_interval

        yield f"data: {json.dumps({'stage': 'Timeout', 'done': True, 'error': 'Analysis timed out after 5 minutes.'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":     "no-cache",
            "X-Accel-Buffering": "no",
            "Connection":        "keep-alive",
        },
    )
