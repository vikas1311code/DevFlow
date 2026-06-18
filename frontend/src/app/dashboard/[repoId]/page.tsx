"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import api from "@/lib/api";
import {
  ArrowLeft, GitPullRequest, Sparkles, Plus, Trash2, CheckCircle2, Clock, Circle,
  Copy, Check, AlertTriangle,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
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

interface TeamProfile {
  username: string;
  personality: string;
  personality_emoji: string;
  total_prs: number;
  avg_risk_score: number;
  avg_files_per_pr: number;
  avg_additions: number;
  docs_prs: number;
  last_updated: string;
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

function StatSkeleton() {
  return (
    <div className="p-4 rounded-lg border animate-pulse" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="h-3 w-20 rounded" style={{ background: "var(--surface-hover)" }} />
      <div className="h-7 w-12 rounded mt-2" style={{ background: "var(--surface-hover)" }} />
    </div>
  );
}

export default function RepoDetail() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const repoId = params.repoId as string;

  const [tab, setTab] = useState<"overview" | "board" | "team" | "settings">("overview");
  const [teamProfiles, setTeamProfiles] = useState<TeamProfile[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [copied, setCopied] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

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
      Promise.all([fetchAnalytics(), fetchIssues()]).finally(() => setDataLoading(false));
    }
  }, [user]);

  const fetchTeamProfiles = async () => {
    setTeamLoading(true);
    try {
      const res = await api.get(`/analytics/team/${repoId}`);
      setTeamProfiles(res.data);
    } catch {} finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "team" && user && teamProfiles.length === 0) fetchTeamProfiles();
  }, [tab, user]);

  const addIssue = async () => {
    if (!newTitle.trim()) return;
    try {
      await api.post(`/issues/repo/${repoId}`, { title: newTitle, priority: "medium" });
      setNewTitle("");
      setShowAdd(false);
      toast.show("Task added");
      fetchIssues();
    } catch {
      toast.show("Task add nahi ho saka", "error");
    }
  };

  const moveIssue = async (id: string, status: string) => {
    try {
      await api.patch(`/issues/${id}`, { status });
      const label = COLUMNS.find((c) => c.key === status)?.label;
      toast.show(`Moved to ${label}`);
      fetchIssues();
    } catch {
      toast.show("Move nahi ho saka", "error");
    }
  };

  const deleteIssue = async (id: string) => {
    try {
      await api.delete(`/issues/${id}`);
      toast.show("Task deleted");
      fetchIssues();
    } catch {
      toast.show("Delete nahi ho saka", "error");
    }
  };

  const disconnectRepo = async () => {
    setDisconnecting(true);
    try {
      await api.delete(`/repos/${repoId}`);
      toast.show("Repo disconnected");
      router.push("/dashboard");
    } catch {
      toast.show("Disconnect nahi ho saka", "error");
      setDisconnecting(false);
    }
  };

  const webhookUrl = `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api$/, "")}/api/webhooks/github`;

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 font-mono text-sm" style={{ color: "var(--text-muted)" }}>
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
          Loading...
        </div>
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
    <main className="min-h-screen animate-fade-in">
      <nav className="flex items-center justify-between px-4 sm:px-8 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-sm transition-colors hover:text-[var(--text)]" style={{ color: "var(--text-muted)" }}>
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="flex items-center gap-2">
          <img src={user.avatar_url} alt={user.username} className="w-7 h-7 rounded-full" />
          <span className="text-sm font-mono hidden sm:inline">{user.username}</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex gap-1 mb-8 border-b overflow-x-auto" style={{ borderColor: "var(--border)" }}>
          {(["overview", "board", "team", "settings"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors whitespace-nowrap"
              style={{
                borderColor: tab === t ? "var(--accent)" : "transparent",
                color: tab === t ? "var(--text)" : "var(--text-muted)",
              }}
            >
              {t === "overview" ? "Overview" : t === "board" ? "Sprint board" : t === "team" ? "Team personalities" : "Settings"}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="animate-fade-in">
            {dataLoading || !analytics ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Total PRs", value: analytics.prStats.total_prs },
                  { label: "Open PRs", value: analytics.prStats.open_prs },
                  { label: "AI Reviewed", value: analytics.prStats.reviewed_prs },
                  { label: "Avg Review Time", value: `${Math.round(Number(analytics.prStats.avg_review_time_sec))}s` },
                ].map((s) => (
                  <div key={s.label} className="p-4 rounded-lg border transition-colors hover:border-[var(--accent)]" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                    <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                    <p className="font-display text-3xl font-semibold mt-1">{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-lg border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <div className="px-5 py-3 border-b font-display font-semibold text-sm" style={{ borderColor: "var(--border)" }}>
                  Recent pull requests
                </div>
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {!dataLoading && analytics?.recentPRs.length === 0 && (
                    <div className="px-5 py-8 text-center">
                      <GitPullRequest size={24} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>No pull requests yet.</p>
                    </div>
                  )}
                  {analytics?.recentPRs.map((pr) => (
                    <div key={pr.github_pr_id} className="px-5 py-3 flex items-center justify-between gap-2 transition-colors hover:bg-[var(--surface-hover)]" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <GitPullRequest size={14} style={{ color: "var(--accent)" }} className="shrink-0" />
                        <span className="text-sm font-mono truncate">{pr.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-xs" style={{ color: "var(--success)" }}>+{pr.additions}</span>
                        <span className="font-mono text-xs" style={{ color: "var(--danger)" }}>-{pr.deletions}</span>
                        {pr.ai_review_status === "completed" && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                            <Sparkles size={10} />
                            <span className="hidden sm:inline">Reviewed</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border p-5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <p className="font-display font-semibold text-sm mb-4">Sprint board distribution</p>
                {issues.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>No issues yet — add some in the Sprint board tab.</p>
                  </div>
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
          <div className="animate-fade-in">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowAdd(!showAdd)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "var(--accent)", color: "var(--bg)" }}
              >
                <Plus size={14} />
                Add task
              </button>
            </div>
            {showAdd && (
              <div className="flex gap-2 mb-4 animate-fade-in">
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
                    {issues.filter((i) => i.status === col.key).length === 0 && (
                      <p className="text-xs text-center py-6" style={{ color: "var(--text-muted)" }}>Empty</p>
                    )}
                    {issues.filter((i) => i.status === col.key).map((issue) => (
                      <div key={issue.id} className="p-3 rounded-md border group transition-colors hover:border-[var(--accent)] animate-fade-in" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm">{issue.title}</p>
                          <button onClick={() => deleteIssue(issue.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={12} style={{ color: "var(--danger)" }} />
                          </button>
                        </div>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {COLUMNS.filter((c) => c.key !== issue.status).map((c) => (
                            <button
                              key={c.key}
                              onClick={() => moveIssue(issue.id, c.key)}
                              className="text-xs font-mono px-2 py-0.5 rounded border transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
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

        {tab === "team" && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display font-semibold text-lg">Team Personalities</h2>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                  AI-assigned roles based on PR patterns & code behaviour
                </p>
              </div>
              <button
                onClick={fetchTeamProfiles}
                className="text-xs font-mono px-3 py-1.5 rounded-md border transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                Refresh
              </button>
            </div>
            {teamLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3].map(i => (
                  <div key={i} className="p-5 rounded-lg border animate-pulse" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                    <div className="h-10 w-10 rounded-full mb-3" style={{ background: "var(--surface-hover)" }} />
                    <div className="h-4 w-24 rounded mb-2" style={{ background: "var(--surface-hover)" }} />
                    <div className="h-3 w-full rounded" style={{ background: "var(--surface-hover)" }} />
                  </div>
                ))}
              </div>
            ) : teamProfiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-5xl mb-4">👥</span>
                <p className="font-display font-semibold mb-1">No profiles yet</p>
                <p className="text-sm max-w-xs" style={{ color: "var(--text-muted)" }}>
                  Personalities are assigned automatically when PRs are merged through DevFlow. Merge a PR to see your team here.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamProfiles.map((profile) => (
                  <div
                    key={profile.username}
                    className="p-5 rounded-lg border transition-all hover:border-[var(--accent)] hover:-translate-y-0.5"
                    style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="text-4xl">{profile.personality_emoji}</div>
                      <span
                        className="text-xs font-mono px-2 py-0.5 rounded-full mt-1"
                        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                      >
                        {profile.personality}
                      </span>
                    </div>
                    <p className="font-display font-semibold mb-0.5">{profile.username}</p>
                    <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                      {profile.personality === "Cowboy" && "Ships fast, breaks things. High risk, high reward."}
                      {profile.personality === "Sniper" && "Laser focused. Small, precise, low-risk changes only."}
                      {profile.personality === "Documenter" && "The team MVP. Always keeps docs and comments up to date."}
                      {profile.personality === "Guardian" && "Security-first mindset. Catches issues others miss."}
                      {profile.personality === "Architect" && "Big thinker. Large structured changes with clear intent."}
                      {profile.personality === "Balanced" && "Steady and consistent. The backbone of the team."}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "PRs", value: profile.total_prs },
                        { label: "Avg Risk", value: `${Math.round(profile.avg_risk_score)}` },
                        { label: "Files/PR", value: `${Math.round(profile.avg_files_per_pr)}` },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-md p-2 text-center"
                          style={{ background: "var(--bg)" }}
                        >
                          <p className="font-display font-semibold text-sm">{stat.value}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "settings" && (
          <div className="animate-fade-in space-y-6 max-w-2xl">
            <div className="rounded-lg border p-5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <p className="font-display font-semibold text-sm mb-1">Webhook setup</p>
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                Point this repo's GitHub webhook to your DevFlow server so PRs trigger AI reviews automatically.
              </p>
              <div className="flex items-center gap-2 mb-4">
                <code className="flex-1 px-3 py-2 rounded-md border text-xs font-mono overflow-x-auto" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                  {webhookUrl}
                </code>
                <button
                  onClick={copyWebhook}
                  className="p-2 rounded-md border shrink-0 transition-colors hover:border-[var(--accent)]"
                  style={{ borderColor: "var(--border)" }}
                >
                  {copied ? <Check size={14} style={{ color: "var(--success)" }} /> : <Copy size={14} />}
                </button>
              </div>
              <ol className="text-sm space-y-1.5 list-decimal list-inside" style={{ color: "var(--text-muted)" }}>
                <li>Go to repo → Settings → Webhooks → Add webhook</li>
                <li>Paste the URL above as Payload URL, content type <code className="font-mono">application/json</code></li>
                <li>Select "Pull requests" under individual events</li>
                <li>Save — DevFlow will review every new PR automatically</li>
              </ol>
              <p className="text-xs mt-3 flex items-center gap-1" style={{ color: "var(--warning)" }}>
                <AlertTriangle size={12} />
                Local dev URLs (ngrok) change on restart — update the webhook if the tunnel restarts.
              </p>
            </div>

            <div className="rounded-lg border p-5" style={{ borderColor: "var(--danger)", background: "var(--surface)" }}>
              <p className="font-display font-semibold text-sm mb-1" style={{ color: "var(--danger)" }}>Danger zone</p>
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                Disconnecting will stop AI reviews and remove this repo from your dashboard.
              </p>
              <button
                onClick={disconnectRepo}
                disabled={disconnecting}
                className="px-4 py-2 rounded-md text-sm font-medium border disabled:opacity-60 transition-colors"
                style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
              >
                {disconnecting ? "Disconnecting..." : "Disconnect repository"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
