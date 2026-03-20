"""
routers/upload.py

FIX APPLIED:
  Bug #5: OnboardingPage sends JD paste as JSON body { text: "..." } (correct)
          but the original upload_jd() only checked file.filename to decide
          which path to take. When both file and body arrive as Optional, FastAPI
          can't mix File() + Body() in the same endpoint cleanly.

          Solution: split into two explicit endpoints:
            POST /upload/jd          — multipart PDF upload
            POST /upload/jd/text     — JSON text body  { "text": "..." }

          OnboardingPage already sends JSON for paste, so only the URL changes
          (see api.js fix).  The PDF path is unchanged.
"""

import uuid
import fitz   # PyMuPDF
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel

from core.auth import get_current_user

router = APIRouter(prefix="/upload", tags=["upload"])

MAX_FILE_BYTES = 10 * 1024 * 1024
ALLOWED_MIMES  = {"application/pdf", "application/x-pdf"}

# In-memory store — fine for single-worker / hackathon use.
# For multi-worker production: move to Redis or DB column.
_file_store: dict[str, str] = {}


def _validate_and_extract(upload: UploadFile) -> str:
    if upload.content_type not in ALLOWED_MIMES:
        raise HTTPException(
            status_code=400,
            detail=f"Only PDF files accepted. Got: {upload.content_type}"
        )

    data = upload.file.read()
    if len(data) > MAX_FILE_BYTES:
        size_mb = len(data) / 1024 / 1024
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size_mb:.1f} MB). Maximum is 10 MB."
        )

    try:
        doc  = fitz.open(stream=data, filetype="pdf")
        text = "\n".join(page.get_text() for page in doc)
        doc.close()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {e}")

    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail="PDF appears to be a scanned image with no extractable text. Please use a text-based PDF."
        )

    return text.strip()


# ── POST /upload/resume ───────────────────────────────────────────────────────
@router.post("/resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    text    = _validate_and_extract(file)
    file_id = str(uuid.uuid4())
    _file_store[file_id] = text

    return {
        "file_id":    file_id,
        "filename":   file.filename,
        "char_count": len(text),
        "preview":    text[:300],
    }


# ── POST /upload/jd  (PDF) ────────────────────────────────────────────────────
@router.post("/jd")
async def upload_jd_file(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    """Upload a JD as a PDF file."""
    text    = _validate_and_extract(file)
    file_id = str(uuid.uuid4())
    _file_store[file_id] = text

    return {
        "file_id":    file_id,
        "char_count": len(text),
        "preview":    text[:300],
    }


# ── POST /upload/jd/text  (JSON paste) ───────────────────────────────────────
class JDTextBody(BaseModel):
    text: str


@router.post("/jd/text")
async def upload_jd_text(
    body: JDTextBody,
    current_user=Depends(get_current_user),
):
    """
    Upload a JD as plain JSON text body.
    Called by OnboardingPage when the user pastes a job description
    or selects a RemoteOK job.

    FIX #5: Previously the paste path sent a Blob(text/plain) which was
    rejected by MIME validation. Now it sends JSON to this dedicated endpoint.
    """
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Text body cannot be empty.")

    file_id = str(uuid.uuid4())
    _file_store[file_id] = body.text.strip()

    return {
        "file_id":    file_id,
        "char_count": len(body.text),
        "preview":    body.text[:300],
    }


# ── Internal helper used by analyze.py ───────────────────────────────────────
def get_file_text(file_id: str) -> str:
    text = _file_store.get(file_id)
    if text is None:
        raise HTTPException(
            status_code=404,
            detail=f"File ID '{file_id}' not found or expired. Please re-upload."
        )
    return text
