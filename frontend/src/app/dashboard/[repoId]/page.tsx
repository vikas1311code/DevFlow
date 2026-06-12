"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import {
  ArrowLeft, GitPullRequest, Sparkles, Plus, Trash2, X, CheckCircle2, Clock, Circle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell,
} from "recharts";

interface PR {
  github_pr_id: number;
  title: string;
  author: string;
  status: string;
  ai_review_status: string;
  additions: number;
  deletions: number;
  created_at: string;
}

interface Issue {
  id: string;
  title: string;
  body: string;
  status: string;
  priority: string;
  assignee: string | null;
}

interface Analytics {
  prStats: {
    total_prs: string;
    open_prs: string;
    merged_prs: string;
    reviewed_prs: string;
    avg_review_time_sec: string;
  };
  issueStats: { status: string; count: string }[];
  recentPRs: PR[];
}

const COLUMNS = [
  { key: "open", label: "Open", icon: Circle },
  { key: "in_progress", label: "In Progress", icon: Clock },
  { key: "done", label: "Done", icon: CheckCircle2 },
];

export default function RepoDetail() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const repoId = params.repoId as string;

  const [tab, setTab] = useState<"overview" | "board">("overview");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user]);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get(`/analytics/repo/${repoId}`);
      setAnalytics(res.data);
    } catch {}
  };

  const fetchIssues = async () => {
    try {
      const res = await api.get(`/issues/repo/${repoId}`);
      setIssues(res.data);
    } catch {}
  };

  useEffect(() => {
    if (user) {
      fetchAnalytics();
      fetchIssues();
    }
  }, [user]);

  const addIssue = async () => {
    if (!newTitle.trim()) return;
    try {
      await api.post(`/issues/repo/${repoId}`, { title: newTitle, priority: "medium" });
      setNewTitle("");
      setShowAdd(false);
      fetchIssues();
    } catch {}
  };

  const moveIssue = async (id: string, status: string) => {
    try {
      await api.patch(`/issues/${id}`, { status });
      fetchIssues();
    } catch {}
  };

  const deleteIssue = async (id: string) => {
    try {
      await api.delete(`/issues/${id}`);
      fetchIssues();
    } catch {}
  };

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-sm" style={{ color: "var(--text-muted)" }}>Loading...</p>
      </main>
    );
  }

  const issueCountByStatus = (status: string) =>
    issues.filter((i) => i.status === status).length;

  const pieData = COLUMNS.map((c) => ({
    name: c.label,
    value: issueCountByStatus(c.key),
  }));

  const pieColors = ["var(--text-muted)", "var(--accent)", "var(--success)"];

  return (
    <main className="min-h-screen">
      <nav className="flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="flex items-center gap-2">
          <img src={user.avatar_url} alt={user.username} className="w-7 h-7 rounded-full" />
          <span className="text-sm font-mono">{user.username}</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b" style={{ borderColor: "var(--border)" }}>
          {(["overview", "board"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors"
              style={{
                borderColor: tab === t ? "var(--accent)" : "transparent",
                color: tab === t ? "var(--text)" : "var(--text-muted)",
              }}
            >
              {t === "overview" ? "Overview" : "Sprint board"}
            </button>
          ))}
        </div>

        {tab === "overview" && analytics && (
          <div>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total PRs", value: analytics.prStats.total_prs },
                { label: "Open PRs", value: analytics.prStats.open_prs },
                { label: "AI Reviewed", value: analytics.prStats.reviewed_prs },
                { label: "Avg Review Time", value: `${Math.round(Number(analytics.prStats.avg_review_time_sec))}s` },
              ].map((s) => (
                <div key={s.label} className="p-4 rounded-lg border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                  <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                  <p className="font-display text-3xl font-semibold mt-1">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent PRs */}
              <div className="rounded-lg border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <div className="px-5 py-3 border-b font-display font-semibold text-sm" style={{ borderColor: "var(--border)" }}>
                  Recent pull requests
                </div>
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {analytics.recentPRs.length === 0 && (
                    <p className="px-5 py-6 text-sm text-center" style={{ color: "var(--text-muted)" }}>No pull requests yet.</p>
                  )}
                  {analytics.recentPRs.map((pr) => (
                    <div key={pr.github_pr_id} className="px-5 py-3 flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <GitPullRequest size={14} style={{ color: "var(--accent)" }} className="shrink-0" />
                        <span className="text-sm font-mono truncate">{pr.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="font-mono text-xs" style={{ color: "var(--success)" }}>+{pr.additions}</span>
                        <span className="font-mono text-xs" style={{ color: "var(--danger)" }}>-{pr.deletions}</span>
                        {pr.ai_review_status === "completed" && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                            <Sparkles size={10} />
                            Reviewed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Issue distribution pie */}
              <div className="rounded-lg border p-5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <p className="font-display font-semibold text-sm mb-4">Sprint board distribution</p>
                {issues.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No issues yet — add some in the Sprint board tab.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={pieColors[i % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "board" && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowAdd(!showAdd)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium"
                style={{ background: "var(--accent)", color: "var(--bg)" }}
              >
                <Plus size={14} />
                Add task
              </button>
            </div>
            {showAdd && (
              <div className="flex gap-2 mb-4">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addIssue()}
                  placeholder="Task title..."
                  className="flex-1 px-3 py-2 rounded-md border bg-transparent text-sm focus:outline-none"
                  style={{ borderColor: "var(--border)" }}
                  autoFocus
                />
                <button onClick={addIssue} className="px-4 py-2 rounded-md text-sm font-medium" style={{ background: "var(--accent)", color: "var(--bg)" }}>
                  Add
                </button>
              </div>
            )}
            <div className="grid md:grid-cols-3 gap-4">
              {COLUMNS.map((col) => (
                <div key={col.key} className="rounded-lg border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                  <div className="px-4 py-3 border-b flex items-center gap-2 text-sm font-display font-semibold" style={{ borderColor: "var(--border)" }}>
                    <col.icon size={14} style={{ color: "var(--text-muted)" }} />
                    {col.label}
                    <span className="ml-auto font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                      {issueCountByStatus(col.key)}
                    </span>
                  </div>
                  <div className="p-3 space-y-2 min-h-[120px]">
                    {issues.filter((i) => i.status === col.key).map((issue) => (
                      <div key={issue.id} className="p-3 rounded-md border group" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm">{issue.title}</p>
                          <button onClick={() => deleteIssue(issue.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={12} style={{ color: "var(--danger)" }} />
                          </button>
                        </div>
                        <div className="flex gap-1 mt-2">
                          {COLUMNS.filter((c) => c.key !== issue.status).map((c) => (
                            <button
                              key={c.key}
                              onClick={() => moveIssue(issue.id, c.key)}
                              className="text-xs font-mono px-2 py-0.5 rounded border"
                              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                            >
                              → {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
