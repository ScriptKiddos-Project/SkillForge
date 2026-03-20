import os
from sentence_transformers import SentenceTransformer

# ── Windows SSL Fix ───────────────────────────────────────────────────────────
# PostgreSQL on Windows sets REQUESTS_CA_BUNDLE to its own cert path.
# This breaks HuggingFace model downloads. Clear these vars so Python
# uses the correct system certificates instead.
for _var in ("REQUESTS_CA_BUNDLE", "SSL_CERT_FILE", "CURL_CA_BUNDLE"):
    if _var in os.environ:
        del os.environ[_var]

_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    """Return a singleton instance of the embedding model."""
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model