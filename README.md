# SkillForge
### Autonomous Skill Intelligence & Adaptive Learning Engine

> *"We didn't build another learning platform. We built a system that learns how you learn."*

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

1. **Extract** skills from résumé (NLP + O*NET)
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
- LLaMA 3.1 (Groq API)
- spaCy (NLP extraction)
- Sentence Transformers (MiniLM)
- FAISS (vector database)
- NetworkX (graph-based logic)

### Database
- PostgreSQL

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

## Security & Reliability

- JWT-based authentication
- Endpoint-level authorization
- Row-level database locking
- Input validation for file uploads
- Fallback quiz system (no demo failure)
- Pre-seeded job data (no external API dependency)

---

## Setup (Without Docker)

### 1. Clone the repository

```bash
git clone https://github.com/ScriptKiddos-Project/SkillForge.git
cd SkillForge/backend
```

### 2. Create a virtual environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Download the spaCy model

```bash
python -m spacy download en_core_web_sm
```

### 5. Configure environment variables

Create a `.env` file in the `backend/` directory:

```env
POSTGRES_USER=skillforge
POSTGRES_PASSWORD=skillforge123
POSTGRES_DB=skillforge
POSTGRES_HOST=localhost

SECRET_KEY=your_secret_key
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
```

### 6. Set up the database

```bash
python -c "from database import Base, engine; Base.metadata.create_all(engine)"
```

### 7. Seed job data

```bash
python -c "from routers.jds import fetch_and_seed_jds; from database import SessionLocal; fetch_and_seed_jds(SessionLocal())"
```

### 8. Run the backend

```bash
uvicorn main:app --reload --port 8000
```

### 9. Run the frontend

```bash
cd ../frontend
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

### Demo Mode

```
http://localhost:5173?demo=true
```

Instant full-experience walkthrough — no AI wait time required.

---

## SkillForge vs Traditional Platforms

| Feature | Traditional Platforms | SkillForge |
|---|---|---|
| Personalization | ❌ | ✅ |
| Adaptive Learning | ❌ | ✅ |
| Skill Gap Analysis | ❌ | ✅ |
| Explainability | ❌ | ✅ |
| Real-time Feedback | ❌ | ✅ |

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
