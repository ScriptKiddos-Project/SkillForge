# SkillForge
### Autonomous Skill Intelligence & Adaptive Learning Engine

> *"We didn't build another learning platform. We built a system that learns how you learn."*

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Python | 3.11+ | python.org |
| Node.js | 18+ | nodejs.org |
| PostgreSQL | 15+ | postgresql.org |
| Git | Latest | git-scm.com |

---

## Overview

SkillForge is an AI-powered adaptive learning engine that transforms static onboarding into a personalized, intelligent, and validated learning journey.

By combining NLP-based skill extraction, category-aware gap analysis, DAG-based learning pathways, and a performance-driven progression system, SkillForge ensures users learn exactly what they need — no more, no less.

Unlike traditional platforms, SkillForge doesn't just recommend content — it verifies understanding, adapts in real-time, and explains every decision.

---

## Problem

Traditional onboarding and learning systems:
- Follow a one-size-fits-all approach
- Lack meaningful personalization
- Do not verify knowledge retention
- Waste time on irrelevant content

---

## Solution

SkillForge introduces an end-to-end intelligent pipeline:

1. **Extract** skills from résumé (NLP + O\*NET)
2. **Parse** job description requirements
3. **Analyze** semantic skill gaps
4. **Generate** dependency-aware learning path (DAG)
5. **Recommend** curated learning resources (FAISS)
6. **Validate** learning using quizzes
7. **Adapt** dynamically based on performance

---

## Key Innovations

| Feature | Description |
|---|---|
| 🧩 Category-Aware Skill Gap Analysis | Prevents false matches (e.g. Java ≠ JavaScript) |
| 🔗 DAG-Based Learning Pathways | Dependency-ordered skill progression |
| 🔁 PASS / REVISE / RETRY Engine | Adaptive progression based on quiz performance |
| 🧠 Explainable AI | Full reasoning traces for every decision |
| ⚡ Real-Time Pipeline | Server-Sent Events (SSE) streaming |
| 💬 Stateful Mentor Chat | LLM-powered conversational assistant |

---

## Setup (Without Docker)

### Get a Groq API Key (Required)

1. Go to https://console.groq.com
2. Sign up — free, takes 2 minutes
3. Create an API key
4. Keep it ready for Step 5 below

---

### 1. Clone the repository

```bash
git clone https://github.com/ScriptKiddos-Project/SkillForge.git
cd SkillForge
```

---

### 2. Set up the backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate — Windows
venv\Scripts\activate

# Activate — macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm
```

---

### 3. Configure backend environment variables

Create a `.env` file inside the `backend/` directory:

```env
POSTGRES_USER=skillforge
POSTGRES_PASSWORD=skillforge123
POSTGRES_DB=skillforge
POSTGRES_HOST=localhost

SECRET_KEY=skillforge-secret-key-32chars-long
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
```

> **Only `GROQ_API_KEY` needs to change.** Get it free at https://console.groq.com

---

### 4. Configure frontend environment variables

Create a `.env` file inside the `frontend/` directory:

```env
VITE_API_URL=http://localhost:8000
```

---

### 5. Set up the database

Make sure PostgreSQL is running, then:

```bash
# From the backend/ directory
python -c "from database import Base, engine; Base.metadata.create_all(engine)"
```

---

### 6. Seed job data

```bash
python -c "from routers.jds import fetch_and_seed_jds; from database import SessionLocal; fetch_and_seed_jds(SessionLocal())"
```

> **Note:** Requires an internet connection. If it fails, the app still works — job data falls back to the pre-seeded `remote_jds_seed.json` file automatically.

---

### 7. Run the backend

```bash
# From the backend/ directory
uvicorn main:app --reload --port 8000
```

---

### 8. Run the frontend

```bash
# Open a new terminal
cd frontend
npm install
npm run dev
```

---

## Access

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

---

## Demo Mode

```
http://localhost:5173?demo=true
```

Instant full-experience walkthrough — no AI wait time, no resume upload required.

> **Tip for judges:** Start with Demo Mode first for an instant overview of all features.
>
> For the full adaptive experience, sign up with a real account and use:
> - Any tech résumé PDF
> - A Machine Learning Engineer or Full Stack Developer job description
>
> The system will generate a personalized pathway in ~30 seconds.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `spaCy model not found` | Run `python -m spacy download en_core_web_sm` inside the venv |
| `FAISS index error` | Delete `data/faiss.index` — rebuilds automatically on next startup |
| `Frontend API errors` | Ensure `frontend/.env` has `VITE_API_URL=http://localhost:8000` |
| `Groq API timeout` | Verify `GROQ_API_KEY` in `backend/.env` — get free key at console.groq.com |
| `sentence-transformers slow first run` | Downloads ~80MB model on first run — wait for completion |
| `Port already in use` | Kill process: `lsof -i :8000` or `lsof -i :5173`, then retry |
| `Database connection error` | Ensure PostgreSQL is running and credentials match `backend/.env` |
| `RemoteOK seed fails` | Safe to ignore — app falls back to local seed file automatically |

---

## System Architecture

```
Frontend (React + Vite)
        ↓
FastAPI Backend (Async APIs + SSE)
        ↓
AI Agents Layer
(Analyzer · Evaluator · Architect · Curator · Mentor)
        ↓
Adaptive Engine (DAG + Knowledge Gating)
        ↓
Data Layer (FAISS + Skill Graph + Course Catalog)
        ↓
PostgreSQL Database
```

---

## User Flow

1. Sign up / log in
2. Upload résumé + job description
3. Click **Analyze** — the system runs:
   - Skill extraction
   - Gap analysis
   - Pathway generation
   - Resource mapping
4. Dashboard displays skill gaps, learning path, and current topic
5. Study resources → take quiz
6. Adaptive engine evaluates performance:
   - ✅ **PASS** (≥ 70%) → unlock next skill
   - 🔁 **REVISE** (40–69%) → target weak subtopic
   - 🔄 **RETRY** (< 40%) → restart with basics
7. Mentor Chat assists throughout

> Learning progression is earned, not assumed.

---

## Tech Stack

### Frontend
- React.js + Vite
- Tailwind CSS
- shadcn/ui
- Recharts
- React Flow

### Backend
- Python + FastAPI
- SQLAlchemy ORM
- Async architecture

### AI / ML
- LLaMA 3.1 via Groq API
- spaCy `en_core_web_sm` — NLP skill extraction
- Sentence Transformers `all-MiniLM-L6-v2` — semantic embeddings
- FAISS — vector similarity search over course catalog
- NetworkX — DAG-based skill graph and topological sort

### Database
- PostgreSQL with JSONB pathway storage and row-level locking

### Datasets Used
- O\*NET Skill Taxonomy — https://www.onetcenter.org/db_releases.html
- RemoteOK Public API — https://remoteok.com/api
- Custom curated course catalog (100+ entries across all skill domains)

---

## Features

- Résumé + JD intelligent parsing
- Semantic skill gap analysis
- Dependency-aware learning paths
- Real-time analysis via SSE
- Quiz-based validation system
- Weak subtopic detection
- Explainable AI reasoning traces
- Stateful Mentor Chat
- DAG visualization
- Demo mode for instant experience

---

## Adaptive Logic (Original Implementation)

The core adaptive engine is entirely original — no library or pre-trained model makes the progression decisions.

**Three mechanisms:**

1. **Category-Aware Knowledge State** — cosine similarity computed only between skills in the same domain category, preventing false matches like Java scoring against JavaScript

2. **Prerequisite-Aware DAG** — NetworkX directed acyclic graph ensures correct learning order (Statistics → ML Fundamentals → Deep Learning) for any resume and JD combination

3. **PASS / REVISE / RETRY Gating** — quiz performance determines path advancement; REVISE identifies the specific weak subtopic from wrong answers; RETRY reloads beginner resources; PASS unlocks the next DAG node with row-level DB locking

> Pre-trained models handle perception. Our original algorithm handles cognition.

---

## Security & Reliability

- JWT-based authentication
- Endpoint-level authorization
- Row-level database locking on pathway updates
- Input validation for file uploads
- Fallback quiz system — demo never breaks
- Pre-seeded job data — no external API dependency during demo

---

## SkillForge vs Traditional Platforms

| Feature | Traditional Platforms | SkillForge |
|---|---|---|
| Personalization | ❌ | ✅ |
| Adaptive Learning | ❌ | ✅ |
| Skill Gap Analysis | ❌ | ✅ |
| Explainability | ❌ | ✅ |
| Real-time Feedback | ❌ | ✅ |
| Knowledge Verification | ❌ | ✅ |

---

## Future Scope

- Fine-tuned domain-specific LLMs
- LinkedIn / Coursera integration
- Gamification (badges, streaks, leaderboards)
- Certification system
- Offline model support
- Enterprise onboarding integration

---

## Team

**Team ScriptKiddos**

- Sakshi Indrasen Singh
- Palak Niraj Upadhyay
- Rhitika Kapoorchand Vishwakarma

---

> *"The future of learning is not content delivery — it is intelligent guidance."*
