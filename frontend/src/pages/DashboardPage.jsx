import React from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { usePathwayStore } from "../store/pathwayStore";
import { useAuthStore } from "../store/authStore";
import SkillGapChart from "../components/charts/SkillGapChart";
import ProgressDonut from "../components/charts/ProgressDonut";
import MentorChat from "../components/chat/MentorChat";
import { demoSkillProfile, demoPathway } from "../data/demoProfile";
import { statusToColor, formatHours } from "../lib/utils";

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div
      className="glass-card p-4 flex-1"
      style={{ borderColor: `${color}25` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-gray-600">{label}</span>
        <span className="text-gray-700">{icon}</span>
      </div>
      <div
        className="font-display text-2xl font-bold mb-1"
        style={{ color, textShadow: `0 0 20px ${color}50` }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="text-xs font-mono"
          style={{ color: sub.startsWith("-") ? "#f87171" : "#00ff88" }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function ModuleRow({ step, onClick }) {
  const color = statusToColor(step.status);
  const badge = {
    complete: "badge-pass",
    active: "badge-active",
    revise: "badge-revise",
    retry: "badge-retry",
    locked: "badge-locked",
  };

  return (
    <tr
      className="border-b transition-all duration-200 cursor-pointer group"
      style={{ borderColor: "rgba(15,32,64,0.6)" }}
      onClick={() => step.status !== "locked" && onClick(step.id)}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "rgba(0,245,255,0.02)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <td className="py-3 px-3">
        <span className="hex-id text-xs">
          {step.id?.slice(0, 8) || "0x????"}
        </span>
      </td>
      <td className="py-3 px-3">
        <span className="text-sm font-body font-semibold text-gray-300">
          {step.skill}
        </span>
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-1 text-xs font-mono text-gray-500">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-3 h-3"
          >
            {step.type === "Video" ? (
              <polygon points="5 3 19 12 5 21" fill="currentColor" />
            ) : (
              <path d="M14 2H6a2 2 0 0 0-2 2v16h16V8z" />
            )}
          </svg>
          {step.type}
        </div>
      </td>
      <td className="py-3 px-3">
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background:
                  i <
                  (step.difficulty === "beginner"
                    ? 1
                    : step.difficulty === "intermediate"
                      ? 2
                      : 3)
                    ? color
                    : "#1f2937",
              }}
            />
          ))}
        </div>
      </td>
      <td className="py-3 px-3">
        <span className={badge[step.status] || "badge-locked"}>
          {step.status?.toUpperCase()}
        </span>
      </td>
      <td className="py-3 px-3">
        {step.status !== "locked" && (
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono"
            style={{ color: "#00f5ff" }}
          >
            OPEN →
          </button>
        )}
      </td>
    </tr>
  );
}

function ActiveModuleCard({ step, upcomingSteps = [], navigate }) {
  if (!step) return null;
  return (
    <div
      className="glass-card p-5 h-full"
      style={{
        borderColor: "rgba(0,245,255,0.2)",
        boxShadow: "0 0 20px rgba(0,245,255,0.05)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono text-gray-500">
          MISSION LOG: PATHWAY
        </span>
      </div>

      {/* Active step */}
      <div
        className="p-4 rounded-lg mb-3"
        style={{
          background: "rgba(0,245,255,0.04)",
          border: "1px solid rgba(0,245,255,0.15)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-body font-bold text-gray-100">{step.skill}</h3>
          <span className="badge-active">ACTIVE</span>
        </div>
        {step.quiz_score && (
          <p className="text-xs font-mono text-gray-500 mb-3">
            System Design Score: {Math.round(step.quiz_score * 100)}% | Time: 4h
            20m
          </p>
        )}
        {step.resources?.slice(0, 2).map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-2 text-xs font-mono text-gray-500 mb-1"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="1.5"
              className="w-3 h-3 flex-shrink-0"
            >
              <polygon points="5 3 19 12 5 21" fill="#60a5fa" />
            </svg>
            {r.title}
          </div>
        ))}
        <button
          onClick={() => navigate(`/topic/${step.id}`)}
          className="btn-neon-solid w-full mt-3 py-2 text-xs"
        >
          INITIATE_MODULE
        </button>
      </div>

      {/* Upcoming */}
      {upcomingSteps.map((s) => (
        <div
          key={s.id}
          className="p-3 rounded mb-2 flex items-center justify-between"
          style={{
            background: "rgba(6,14,31,0.6)",
            border: "1px solid rgba(15,32,64,0.8)",
          }}
        >
          <span className="text-sm font-body text-gray-500">{s.skill}</span>
          <span className="text-xs font-mono text-gray-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-3 h-3 inline mr-1"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            LOCKED
          </span>
        </div>
      ))}
      {/* 
      <div className="flex items-center gap-2 mt-3">
        <input placeholder="QUERY_DB..." className="neon-input flex-1 py-2 text-xs" style={{ fontSize: 11 }} />
      </div> */}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { pathway, skillProfile, setPathway, setSkillProfile, chatWidth, setChatWidth } = usePathwayStore();
  const { user, isDemo } = useAuthStore();

  // Fetch from backend on mount if store is empty (e.g. after page refresh)
  // This ensures dashboard always shows THIS user's data, never the demo fallback
  const [showAnalysePopup, setShowAnalysePopup] = React.useState(false)
  const [searchParams] = React.useState(() => new URLSearchParams(window.location.search))
  const [showDemoPopup, setShowDemoPopup] = React.useState(searchParams.get('demo_done') === 'true')
  const [loading, setLoading] = React.useState(false);
  const isResizing = React.useRef(false);
  React.useEffect(() => {
    if (isDemo || !user?.id) return
    setLoading(true);
    import("../lib/api").then(({ default: api }) => {
      api
        .get(`/api/pathway/${user.id}`)
        .then((res) => {
          setPathway(res.data);
          // Also try to get skill profile
          return api
            .get(`/api/analyze/skill-profile/${user.id}`)
            .catch(() => null);
        })
        .then((profileRes) => {
          if (profileRes) setSkillProfile(profileRes.data);
        })
        .catch((err) => {
          if (err?.response?.status === 404) {
            setShowAnalysePopup(true);
          }
        })
        .finally(() => setLoading(false));
    });
  }, [user?.id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <p className="font-mono text-sm" style={{ color: "#00f5ff" }}>
            ⟳ Loading your pathway...
          </p>
        </div>
      </AppLayout>
    );
  }

  const profile = isDemo ? (skillProfile || demoSkillProfile) : skillProfile;
  const pw = isDemo ? (pathway || demoPathway) : pathway;
  // const pw = pathway || (isDemo ? demoPathway : null);

  if (!pw) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="font-mono text-sm text-gray-500">No pathway found.</p>
          <button
            onClick={() => navigate("/onboarding")}
            className="btn-neon-solid px-6 py-2"
          >
            START ONBOARDING →
          </button>
        </div>

        {showAnalysePopup && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: "rgba(2,6,18,0.85)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div
              className="glass-card p-8 max-w-md w-full mx-4 text-center"
              style={{
                borderColor: "rgba(0,255,136,0.3)",
                boxShadow: "0 0 40px rgba(0,255,136,0.08)",
              }}
            >
              <div className="text-3xl mb-4">🧠</div>
              <h2 className="font-display text-xl font-bold text-gray-100 mb-2">
                Welcome, {user?.full_name?.split(" ")[0] || "Learner"}
              </h2>
              <p className="text-sm font-mono text-gray-400 mb-6 leading-relaxed">
                To get your customised learning pathway, please analyse your
                resume first. It only takes a moment.
              </p>
              <button
                onClick={() => navigate("/onboarding")}
                className="btn-neon-solid px-8 py-2 text-sm w-full"
              >
                ANALYSE MY RESUME →
              </button>
              {/* <button
                onClick={() => setShowAnalysePopup(false)}
                className="mt-4 text-xs font-mono text-gray-600 hover:text-gray-400 transition-colors block mx-auto"
              >
                skip for now →
              </button> */}
            </div>
          </div>
        )}
      </AppLayout>
    );
  }

  const activeStep = pw.steps.find((s) => s.status === "active");
  const completedCount = pw.steps.filter((s) => s.status === "complete").length;

  // compute at top of component, after pw is defined
  const batchRate = pw.steps.length
    ? Math.round((completedCount / pw.steps.length) * 100)
    : 0;
  const estimatedHours = pw.steps.reduce(
    (sum, s) => sum + (s.estimated_hours || 0),
    0,
  );

  // const { chatWidth, setChatWidth } = usePathwayStore();
  // const isResizing = React.useRef(false);
  // const [searchParams] = React.useState(
  //   () => new URLSearchParams(window.location.search),
  // );
  // const [showDemoPopup, setShowDemoPopup] = React.useState(
  //   searchParams.get("demo_done") === "true",
  // );
  // const [showAnalysePopup, setShowAnalysePopup] = React.useState(false);

  // React.useEffect(() => {
  //   if (!isDemo && !pathway && !!user?.id) {
  //     setShowAnalysePopup(true);
  //   }
  // }, [pathway, isDemo, user?.id]);

  function startResize(e) {
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = chatWidth;

    function onMove(e) {
      if (!isResizing.current) return;
      const delta = startX - e.clientX;
      setChatWidth(Math.min(500, Math.max(200, startWidth + delta)));
    }
    function onUp() {
      isResizing.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-48px)] flex overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Top stat cards */}
          <div className="flex gap-4">
            <div
              className="glass-card p-4 flex items-center gap-4"
              style={{ borderColor: "rgba(0,245,255,0.2)" }}
            >
              <ProgressDonut value={batchRate} label="BATCH RATE" size="md" />
            </div>

            <StatCard
              label="MODULES COMPLETED"
              value={`${completedCount}/${pw.steps.length}`}
              color="#00ff88"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-4 h-4"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              }
            />

            <StatCard
              label="EST. TIME TO READY"
              value={`${estimatedHours} hrs`}
              // sub={`▾ -8 hrs from baseline`}
              color="#f59e0b"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-4 h-4"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              }
            />
          </div>

          {/* Middle row */}
          <div className="grid grid-cols-2 gap-4" style={{ minHeight: 280 }}>
            {/* Radar/Gap chart */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-gray-500">
                  SKILL VECTOR MAPPING
                </span>
                <span className="hex-id">∿ Current ↑</span>
              </div>
              <SkillGapChart
                data={(profile?.gap_skills || pw?.steps || []).map((s) => ({
                skill: s.name || s.skill || "Unknown",
                gap_score: s.knowledge_state != null ? (1 - s.knowledge_state) : 0.8,
                confidence: s.knowledge_state != null ? Math.round(s.knowledge_state * 100) : 0,
                category: s.category || "general",
                priority: s.priority != null ? s.priority + 1 : 1,
              }))}
              />
            </div>

            {/* Active module */}
            <ActiveModuleCard
              step={activeStep}
              upcomingSteps={pw.steps
                .filter((s) => s.status === "locked")
                .slice(0, 2)}
              navigate={navigate}
            />
          </div>

          {/* Module table */}
          <div className="glass-card overflow-hidden">
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: "rgba(15,32,64,0.8)" }}
            >
              <span className="text-xs font-mono text-gray-500">
                SKILL CATALOG
              </span>
              <button
                onClick={() => navigate("/pathway")}
                className="text-xs font-mono"
                style={{ color: "#00f5ff" }}
              >
                VIEW PATHWAY →
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(15,32,64,0.8)" }}>
                  {[
                    "ID_HASH",
                    "MODULE NAME",
                    "TYPE",
                    "DIFFICULTY",
                    "STATUS",
                    "ACTION",
                  ].map((h) => (
                    <th
                      key={h}
                      className="py-2 px-3 text-left text-xs font-mono text-gray-600"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pw.steps.slice(0, 6).map((step) => (
                  <ModuleRow
                    key={step.id}
                    step={step}
                    onClick={(id) => navigate(`/topic/${id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right chat panel */}
        <div
          className="flex-shrink-0 border-l flex flex-col overflow-hidden relative"
          style={{
            borderColor: "rgba(15,32,64,0.8)",
            width: chatWidth,
            height: "100%",
          }}
        >
          {/* Resize handle */}
          <div
            onMouseDown={startResize}
            className="absolute left-0 top-0 h-full w-1 cursor-col-resize z-10 transition-colors"
            style={{ background: "transparent" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(0,245,255,0.3)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          />
          <div className="flex-1 overflow-hidden p-3">
            <MentorChat compact />
          </div>
        </div>

        {/* Demo mode: login to get real analysis */}
        {showDemoPopup && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: "rgba(2,6,18,0.85)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div
              className="glass-card p-8 max-w-md w-full mx-4 text-center"
              style={{
                borderColor: "rgba(0,245,255,0.3)",
                boxShadow: "0 0 40px rgba(0,245,255,0.1)",
              }}
            >
              <div className="text-3xl mb-4">🔒</div>
              <h2 className="font-display text-xl font-bold text-gray-100 mb-2">
                You're in Demo Mode
              </h2>
              <p className="text-sm font-mono text-gray-400 mb-6 leading-relaxed">
                This is a pre-built sample pathway. Login or sign up to analyse
                your own resume and get a personalised learning pathway.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    useAuthStore.getState().logout();
                    navigate("/login");
                  }}
                  className="btn-neon-solid px-6 py-2 text-sm"
                >
                  LOGIN →
                </button>
                <button
                  onClick={() => {
                    useAuthStore.getState().logout();
                    navigate("/signup");
                  }}
                  className="px-6 py-2 text-sm font-mono border rounded"
                  style={{
                    borderColor: "rgba(0,245,255,0.2)",
                    color: "#94a3b8",
                  }}
                >
                  SIGN UP
                </button>
              </div>
              <button
                onClick={() => setShowDemoPopup(false)}
                className="mt-4 text-xs font-mono text-gray-600 hover:text-gray-400 transition-colors block mx-auto"
              >
                continue in demo →
              </button>
            </div>
          </div>
        )}

        {/* New user: no pathway yet, prompt to analyse */}
        {showAnalysePopup && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: "rgba(2,6,18,0.85)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div
              className="glass-card p-8 max-w-md w-full mx-4 text-center"
              style={{
                borderColor: "rgba(0,255,136,0.3)",
                boxShadow: "0 0 40px rgba(0,255,136,0.08)",
              }}
            >
              <div className="text-3xl mb-4">🧠</div>
              <h2 className="font-display text-xl font-bold text-gray-100 mb-2">
                Welcome, {user?.full_name?.split(" ")[0] || "Learner"}
              </h2>
              <p className="text-sm font-mono text-gray-400 mb-6 leading-relaxed">
                To get your customised learning pathway, please analyse your
                resume first. It only takes a moment.
              </p>
              <button
                onClick={() => navigate("/onboarding")}
                className="btn-neon-solid px-8 py-2 text-sm w-full"
              >
                ANALYSE MY RESUME →
              </button>
              {/* <button
                onClick={() => setShowAnalysePopup(false)}
                className="mt-4 text-xs font-mono text-gray-600 hover:text-gray-400 transition-colors block mx-auto"
              >
                skip for now →
              </button> */}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
