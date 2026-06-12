"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { GitPullRequest, Plus, LogOut, ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/icons";

interface Repo {
  id: string;
  name: string;
  full_name: string;
  is_active: boolean;
}

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [showConnect, setShowConnect] = useState(false);
  const [repoInput, setRepoInput] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user]);

  const fetchRepos = async () => {
    try {
      const res = await api.get("/repos");
      setRepos(res.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user) fetchRepos();
  }, [user]);

  const handleConnect = async () => {
    setError("");
    const parts = repoInput.replace("https://github.com/", "").split("/");
    if (parts.length !== 2) {
      setError("Format: owner/repo ya GitHub URL daalo");
      return;
    }
    setConnecting(true);
    try {
      await api.post("/repos/connect", { owner: parts[0], repo: parts[1] });
      setRepoInput("");
      setShowConnect(false);
      fetchRepos();
    } catch (err: any) {
      setError(err.response?.data?.error || "Connect nahi ho saka");
    } finally {
      setConnecting(false);
    }
  };

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-sm" style={{ color: "var(--text-muted)" }}>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <GitPullRequest size={16} color="var(--bg)" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">DevFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={user.avatar_url} alt={user.username} className="w-7 h-7 rounded-full" />
            <span className="text-sm font-mono">{user.username}</span>
          </div>
          <button onClick={logout} className="p-2 rounded-md hover:bg-[var(--surface-hover)]" title="Logout">
            <LogOut size={16} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold">Your repositories</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Connect a repo to get AI reviews on every pull request.
            </p>
          </div>
          <button
            onClick={() => setShowConnect(!showConnect)}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
            style={{ background: "var(--accent)", color: "var(--bg)" }}
          >
            <Plus size={16} />
            Connect repo
          </button>
        </div>

        {showConnect && (
          <div className="mb-6 p-4 rounded-lg border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <label className="text-sm font-mono block mb-2" style={{ color: "var(--text-muted)" }}>
              owner/repo (e.g. vikas1311code/devflow-test)
            </label>
            <div className="flex gap-2">
              <input
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="owner/repo"
                className="flex-1 px-3 py-2 rounded-md border bg-transparent text-sm font-mono focus:outline-none focus:ring-1"
                style={{ borderColor: "var(--border)" }}
              />
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="px-4 py-2 rounded-md text-sm font-medium"
                style={{ background: "var(--accent)", color: "var(--bg)" }}
              >
                {connecting ? "Connecting..." : "Connect"}
              </button>
            </div>
            {error && <p className="text-sm mt-2" style={{ color: "var(--danger)" }}>{error}</p>}
          </div>
        )}

        {repos.length === 0 ? (
          <div className="text-center py-20 rounded-lg border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <GitPullRequest size={32} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p style={{ color: "var(--text-muted)" }}>No repositories connected yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {repos.map((repo) => (
              <div
                key={repo.id}
                onClick={() => router.push(`/dashboard/${repo.id}`)}
                className="p-5 rounded-lg border cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-sm">
                    <GithubIcon size={14} />
                    {repo.full_name}
                  </div>
                  <ExternalLink size={14} style={{ color: "var(--text-muted)" }} />
                </div>
                <span
                  className="inline-block mt-3 px-2 py-0.5 rounded text-xs font-mono"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                >
                  {repo.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
