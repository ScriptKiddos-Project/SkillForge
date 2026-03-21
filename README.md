🚀 SkillForge
Autonomous Skill Intelligence & Adaptive Learning Engine

“We didn’t build another learning platform. We built a system that learns how you learn.”

🧠 Executive Summary

SkillForge is an AI-powered adaptive learning engine that transforms static onboarding into a personalized, intelligent, and validated learning journey.

By combining NLP-based skill extraction, category-aware gap analysis, DAG-based learning pathways, and a performance-driven progression system, SkillForge ensures that users learn exactly what they need — no more, no less.

Unlike traditional platforms, SkillForge doesn’t just recommend content — it verifies understanding, adapts in real-time, and explains every decision.

❌ Problem

Traditional onboarding and learning systems:

Follow one-size-fits-all approach
Lack personalization
Do not verify knowledge
Waste time on irrelevant content
💡 Solution

SkillForge introduces an end-to-end intelligent pipeline:
📄 Extract skills from Resume (NLP + O*NET)
🧠 Parse Job Description requirements
📊 Perform semantic skill gap analysis
🔗 Generate dependency-aware learning path (DAG)
📚 Recommend curated learning resources (FAISS)
📝 Validate learning using quizzes
🔁 Adapt dynamically using performance


🔥 Key Innovations
🧩 Category-Aware Skill Gap Analysis (prevents false matches like Java ≠ JavaScript)
🔗 DAG-Based Learning Pathway Generation
🔁 PASS / REVISE / RETRY Adaptive Engine
🧠 Explainable AI (Reasoning Traces)
⚡ Real-Time Pipeline (SSE Streaming)
💬 Stateful Mentor Chat (LLM-powered)


🏗️ System Architecture
Frontend (React + Vite)
        ↓
FastAPI Backend (Async APIs + SSE)
        ↓
AI Agents Layer
(Analyzer, Evaluator, Architect, Curator, Mentor)
        ↓
Adaptive Engine (DAG + Knowledge Gating)
        ↓
Data Layer (FAISS + Skill Graph + Course Catalog)
        ↓
PostgreSQL Database


🔄 User Flow
1.User signs up / logs in
2.Uploads Resume + Job Description
3.Clicks Analyze
System processes:
Skill extraction
Gap analysis
Pathway generation
Resource mapping
4.Dashboard shows:
Skill gaps
Learning path
Current topic
User studies resources → takes quiz
5.Adaptive engine decides:
✅ PASS → move forward
🔁 REVISE → fix weak areas
🔄 RETRY → relearn basics
6.Mentor Chat assists continuously

⚙️ Tech Stack
🖥️ Frontend
React.js + Vite
Tailwind CSS
shadcn/ui
Recharts
React Flow

⚙️ Backend
Python + FastAPI
SQLAlchemy ORM
Async architecture

🤖 AI / ML
LLaMA 3.1 (Groq API)
spaCy (NLP extraction)
Sentence Transformers (MiniLM)
FAISS (Vector Database)
NetworkX (Graph-based logic)

🗄️ Database
PostgreSQL

🧠 Core Adaptive Logic
Score ≥ 70%   → PASS (unlock next skill)
Score 40–69%  → REVISE (target weak subtopic)
Score < 40%   → RETRY (restart with basics)

👉 Learning progression is earned, not assumed

📊 Features
Resume + JD intelligent parsing
Semantic skill gap analysis
Dependency-aware learning paths
Real-time analysis (SSE)
Quiz-based validation system
Weak subtopic detection
Explainable AI reasoning
Mentor Chat (stateful)
DAG visualization
Demo mode (instant experience)


📈 Evaluation Metrics
Skill extraction accuracy
Gap detection precision
Learning pathway efficiency
Quiz performance improvement rate
Completion rate
System latency

🚀 Future Scope
Fine-tuned domain-specific LLMs
Integration with LinkedIn / Coursera
Gamification (badges, streaks, leaderboards)
Certification system
Offline model support
Enterprise onboarding integration

🛠️ Setup Instructions 
🔹 Clone Repository
git clone https://github.com/ScriptKiddos-Project/SkillForge.git
cd SkillForge/backend
🔹 Create Virtual Environment
python -m venv venv
venv\Scripts\activate   # Windows

# OR

source venv/bin/activate   # Mac/Linux
🔹 Install Dependencies
pip install -r requirements.txt
🔹 Download spaCy Model
python -m spacy download en_core_web_sm
🔹 Configure Environment Variables

Create .env file:

POSTGRES_USER=skillforge
POSTGRES_PASSWORD=skillforge123
POSTGRES_DB=skillforge
POSTGRES_HOST=localhost

SECRET_KEY=your_secret_key
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
🔹 Setup Database
python -c "from database import Base, engine; Base.metadata.create_all(engine)"
🔹 Seed Job Data
python -c "from routers.jds import fetch_and_seed_jds; from database import SessionLocal; fetch_and_seed_jds(SessionLocal())"
🔹 Run Backend
uvicorn main:app --reload --port 8000
🔹 Run Frontend
cd ../frontend
npm install
npm run dev

🌐 Access
Frontend → http://localhost:5173
Backend → http://localhost:8000
API Docs → http://localhost:8000/docs

🎯 Demo Mode
http://localhost:5173?demo=true

👉 Instant full experience (no AI wait time)

👥 Team

Team ScriptKiddos

Sakshi Indrasen Singh
Palak Niraj Upadhyay
Rhitika Kapoorchand Vishwakarma


🏁 Final Note

SkillForge is not just a project — it is a shift from passive learning systems to intelligent, adaptive skill evolution.

“The future of learning is not content delivery — it is intelligent guidance.”
