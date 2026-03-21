import { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import ScoreTimeline from "../components/charts/ScoreTimeline";
import ProgressDonut from "../components/charts/ProgressDonut";
import { usePathwayStore } from "../store/pathwayStore";
import { useAuthStore } from "../store/authStore";
import { demoProgress, demoPathway } from "../data/demoProfile";
import api from "../lib/api";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { scoreToColor, statusToColor } from "../lib/utils";

function QuizAttemptRow({ step, index }) {
  if (!step) return null;
  const pct = Math.round(step.score * 100);
  const color = scoreToColor(step.score);
  const label =
    step.action || (pct >= 70 ? "PASS" : pct >= 40 ? "REVISE" : "RETRY");
  return (
    <tr className="border-b" style={{ borderColor: "rgba(15,32,64,0.6)" }}>
      <td className="py-3 px-4 text-xs font-mono text-gray-600">
        {String(index + 1).padStart(2, "0")}
      </td>
      <td className="py-3 px-4 text-sm font-body font-semibold text-gray-300">
        {step.skill}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-gray-800 max-w-[80px]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: color,
                boxShadow: `0 0 6px ${color}60`,
              }}
            />
          </div>
          <span className="text-xs font-mono font-bold" style={{ color }}>
            {pct}%
          </span>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={`badge-${label.toLowerCase()}`}>{label}</span>
      </td>
      <td className="py-3 px-4 text-xs font-mono text-gray-600">
        {step.date ? new Date(step.date).toLocaleDateString() : "—"}
      </td>
    </tr>
  );
}

export default function ProgressPage() {
  const { pathway, setPathway } = usePathwayStore();
  const { user, isDemo } = useAuthStore();
  const [progress, setProgress] = useState(null);

  useEffect(() => {
  if (isDemo) {
    setProgress(demoProgress);
    return;
  }

    // Always refetch pathway on progress page to get latest quiz scores
    api
      .get(`/api/pathway/${user.id}`)
      .then((r) => setPathway(r.data))
      .catch(() => {});

    api
      .get(`/api/progress/${user.id}`)
      .then((r) => {
        console.log("[PROGRESS]", r.data);
        setProgress(r.data);
      })
      .catch((e) => {
        console.error("[PROGRESS FAILED]", e);
        setProgress(demoProgress);
      });
  }, [user?.id]);

  if (!progress) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-48px)]">
          <span className="text-xs font-mono text-gray-500 animate-pulse">
            // Loading...
          </span>
        </div>
      </AppLayout>
    );
  }

  const pw = pathway || demoPathway;
  const prog = progress || demoProgress;

  const avgScore = prog?.attempts_table?.length
    ? Math.round(
        (prog.attempts_table.reduce((a, s) => a + s.score, 0) /
          prog.attempts_table.length) *
          100,
      )
    : 0;

  const completePct =
    prog.pct != null
      ? Math.round(prog.pct)
      : Math.round(
          (pw.steps.filter((s) => s.status === "complete").length /
            pw.steps.length) *
            100,
        );

  return (
    <AppLayout>
      <div className="p-5 space-y-5 overflow-y-auto h-[calc(100vh-48px)]">
        {/* Header */}
        <div>
          <h1 className="font-display text-xl font-bold neon-text-cyan">
            PROGRESS ANALYTICS
          </h1>
          <p className="text-xs font-mono text-gray-500 mt-1">
            Performance metrics · quiz history · skill velocity
          </p>
        </div>

        {/* Top KPI row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: "OVERALL COMPLETION",
              value: `${completePct}%`,
              color: "#00f5ff",
            },
            {
              label: "AVG QUIZ SCORE",
              value: `${avgScore}%`,
              color: scoreToColor(avgScore / 100),
            },
            {
              label: "STUDY HOURS",
              value:
                prog.total_study_hours != null
                  ? `${prog.total_study_hours}h`
                  : "—",
              color: "#a78bfa",
            },
            {
              label: "STREAK",
              value: prog.streak_days != null ? `${prog.streak_days}d` : "—",
              color: "#f59e0b",
            },
          ].map((k) => (
            <div key={k.label} className="glass-card p-4">
              <div className="text-xs font-mono text-gray-600 mb-2">
                {k.label}
              </div>
              <div
                className="font-display text-2xl font-bold"
                style={{ color: k.color, textShadow: `0 0 15px ${k.color}50` }}
              >
                {k.value}
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Score timeline */}
          <div className="col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-gray-500">
                QUIZ SCORE TIMELINE
              </span>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1">
                  <div
                    className="w-6 h-px"
                    style={{ background: "rgba(0,255,136,0.4)" }}
                  />
                  <span className="text-gray-600">PASS (70%)</span>
                </span>
                <span className="flex items-center gap-1">
                  <div
                    className="w-6 h-px"
                    style={{ background: "rgba(251,191,36,0.4)" }}
                  />
                  <span className="text-gray-600">REVISE (40%)</span>
                </span>
              </div>
            </div>
            <ScoreTimeline
              data={(prog.attempts_table ?? []).map((a) => ({
                skill: a.skill,
                score: Math.round(a.score * 100),
                date: new Date(a.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                }),
                action: a.action,
              }))}
            />
          </div>

          {/* Donuts */}
          <div className="glass-card p-5 flex flex-col items-center justify-center gap-6">
            <ProgressDonut value={completePct} label="COMPLETION" size="lg" />
            <div className="flex gap-6">
              <ProgressDonut
                value={prog.quiz_pass_rate ?? 0}
                label="PASS RATE"
                size="sm"
              />
              <ProgressDonut value={avgScore} label="AVG SCORE" size="sm" />
            </div>
          </div>
        </div>

        {/* Radar + table row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Skill radar */}
          <div className="glass-card p-5">
            <span className="text-xs font-mono text-gray-500 block mb-4">
              SKILL RADAR
            </span>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={prog.skill_radar ?? []} cx="50%" cy="50%" outerRadius="80%">
                  <PolarGrid stroke="rgba(15,32,64,0.8)" />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{
                      fill: "#6b7280",
                      fontSize: 10,
                      fontFamily: "JetBrains Mono",
                    }}
                  />
                  <Radar
                    name="Current"
                    dataKey="current"
                    stroke="#00f5ff"
                    fill="rgba(0,245,255,0.1)"
                    strokeWidth={1.5}
                  />
                  <Radar
                    name="Target"
                    dataKey="target"
                    stroke="rgba(0,102,255,0.5)"
                    fill="rgba(0,102,255,0.05)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(6,14,31,0.95)",
                      border: "1px solid rgba(0,245,255,0.2)",
                      borderRadius: 4,
                      fontFamily: "JetBrains Mono",
                      fontSize: 11,
                    }}
                    labelStyle={{ color: "#00f5ff" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quiz history table */}
          <div className="col-span-2 glass-card overflow-hidden">
            <div
              className="p-4 border-b"
              style={{ borderColor: "rgba(15,32,64,0.8)" }}
            >
              <span className="text-xs font-mono text-gray-500">
                QUIZ ATTEMPT HISTORY
              </span>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(15,32,64,0.8)" }}>
                  {["#", "MODULE", "SCORE", "RESULT", "ATTEMPTS"].map((h) => (
                    <th
                      key={h}
                      className="py-2 px-4 text-left text-xs font-mono text-gray-600"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(prog?.attempts_table || []).map((step, i) => (
                  <QuizAttemptRow
                    key={`${step.skill}-${step.date}-${i}`}
                    step={step}
                    index={i}
                  />
                ))}
                {(prog?.attempts_table || []).length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-xs font-mono text-gray-700"
                    >
                      // No quiz attempts yet · Complete a module to see results
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pathway status breakdown */}
        <div className="glass-card p-5">
          <span className="text-xs font-mono text-gray-500 block mb-4">
            PATHWAY STATUS BREAKDOWN
          </span>
          <div className="flex items-end gap-3 h-20">
            {pw.steps.map((step) => {
              const color = statusToColor(step.status);
              const heightMap = {
                complete: 100,
                active: 80,
                revise: 60,
                retry: 40,
                locked: 20,
              };
              const h = heightMap[step.status] || 20;
              return (
                <div
                  key={step.id}
                  className="flex-1 flex flex-col items-center gap-1 group"
                >
                  <div
                    className="w-full rounded-t transition-all duration-300"
                    style={{
                      height: `${h}%`,
                      background: `${color}30`,
                      border: `1px solid ${color}40`,
                      boxShadow:
                        step.status === "active"
                          ? `0 0 10px ${color}40`
                          : "none",
                    }}
                  />
                  <span
                    className="text-xs font-mono text-gray-700 truncate w-full text-center"
                    style={{ fontSize: 9 }}
                  >
                    {step.order}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
