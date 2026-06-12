"use client";
import { GitPullRequest, Sparkles, KanbanSquare, BarChart3 } from "lucide-react";
import { GithubIcon } from "@/components/icons";

export default function LandingPage() {
  const handleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/github`;
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <GitPullRequest size={16} color="var(--bg)" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">DevFlow</span>
        </div>
        <button
          onClick={handleLogin}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-colors hover:bg-[var(--surface-hover)]"
          style={{ borderColor: "var(--border)" }}
        >
          <GithubIcon size={16} />
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-6 border"
          style={{ borderColor: "var(--border)", color: "var(--accent)" }}
        >
          <Sparkles size={12} />
          AI-powered PR reviews, live
        </div>
        <h1 className="font-display text-5xl md:text-6xl font-semibold tracking-tight max-w-2xl leading-tight">
          Ship code with a reviewer that never sleeps
        </h1>
        <p className="mt-5 text-lg max-w-xl" style={{ color: "var(--text-muted)" }}>
          DevFlow reads every pull request, flags issues before they merge, and keeps your sprint board in sync — automatically.
        </p>
        <button
          onClick={handleLogin}
          className="mt-8 flex items-center gap-2 px-6 py-3 rounded-md font-medium text-sm transition-transform hover:scale-[1.02]"
          style={{ background: "var(--accent)", color: "var(--bg)" }}
        >
          <GithubIcon size={18} />
          Continue with GitHub
        </button>

        {/* Signature: mock PR review card */}
        <div
          className="mt-20 w-full max-w-2xl rounded-lg border text-left overflow-hidden"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 font-mono text-sm">
              <GitPullRequest size={14} style={{ color: "var(--accent)" }} />
              <span>feat: add rate limiter to auth routes</span>
            </div>
            <span className="font-mono text-xs" style={{ color: "var(--success)" }}>+42</span>
            <span className="font-mono text-xs ml-1" style={{ color: "var(--danger)" }}>-8</span>
          </div>
          <div className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
              <span className="font-mono text-xs" style={{ color: "var(--accent)" }}>DevFlow AI Review</span>
            </div>
            <p>Summary: Adds a sliding-window limiter to <code className="font-mono">/auth</code> endpoints. No major issues found. Consider extracting the limiter config into a shared constants file for reuse.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-6 px-8 py-16 border-t max-w-5xl mx-auto w-full" style={{ borderColor: "var(--border)" }}>
        {[
          { icon: Sparkles, title: "AI code review", desc: "Every PR gets an instant, structured review with issues and suggestions." },
          { icon: KanbanSquare, title: "Sprint board", desc: "Track issues across open, in progress, and done — synced with GitHub." },
          { icon: BarChart3, title: "Analytics", desc: "Review turnaround time, merge rates, and team velocity at a glance." },
        ].map((f) => (
          <div key={f.title} className="p-5 rounded-lg border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <f.icon size={20} style={{ color: "var(--accent)" }} />
            <h3 className="font-display font-semibold mt-3">{f.title}</h3>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
