<div align="center">

# DevFlow

### AI-powered pull request reviewer, sprint board & analytics — for developer teams who ship fast.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-dev--flow--red--rho.vercel.app-C9A05E?style=for-the-badge)](https://dev-flow-red-rho.vercel.app)
[![Backend](https://img.shields.io/badge/API-Render-46E3B7?style=for-the-badge)](https://devflow-gbcj.onrender.com/health)
[![License](https://img.shields.io/badge/License-MIT-8C8E96?style=for-the-badge)](LICENSE)

[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![Express](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Gemini API](https://img.shields.io/badge/Gemini_API-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)

</div>

---

## What is DevFlow?

DevFlow is a self-hosted GitHub app that turns every pull request into a reviewed, tracked, and measured unit of work — automatically.

The moment a developer opens a PR, DevFlow:
1. **Reads the full diff** via the GitHub API
2. **Sends it to Gemini AI** for a structured code review (verdict, severity-tagged issues, suggestions)
3. **Posts the review as a PR comment** — no human reviewer needed for first-pass feedback
4. **Logs everything to PostgreSQL** for analytics
5. Surfaces it all on a **live dashboard** with a Kanban sprint board

> 🔗 **Try it live**: [dev-flow-red-rho.vercel.app](https://dev-flow-red-rho.vercel.app)

---

## ✨ Features

| | |
|---|---|
| 🤖 **AI Code Review** | Every PR gets a verdict (`Approve` / `Comment` / `Request Changes`), severity-tagged issues (`Critical`/`Major`/`Minor`), and actionable suggestions — posted directly to GitHub. |
| 🔐 **GitHub OAuth + JWT** | Secure login, access + refresh tokens, role-based access control middleware. |
| ⚡ **Real-time Webhooks** | GitHub PR events ingested instantly; AI review pipeline kicks off within seconds of a push. |
| 📋 **Sprint Board** | Drag-free Kanban (Open → In Progress → Done) scoped per repository. |
| 📊 **Analytics Dashboard** | PR throughput, AI review coverage, diff size trends, sprint distribution — via Recharts. |
| 🛡️ **Hardened API** | Helmet, rate limiting, CORS, parameterized queries, upsert-safe webhook handling. |
| 🎨 **Custom UI** | Hand-designed dark theme — no template defaults. |

---

## 📸 Screenshots

<table>
<tr>
<td width="50%">

**Landing**
![Landing](docs/screenshots/landing.png)

</td>
<td width="50%">

**Dashboard**
![Dashboard](docs/screenshots/dashboard.png)

</td>
</tr>
<tr>
<td width="50%">

**Analytics Overview**
![Overview](docs/screenshots/overview.png)

</td>
<td width="50%">

**Sprint Board**
![Sprint Board](docs/screenshots/sprint-board.png)

</td>
</tr>
<tr>
<td width="50%">

**AI Review on GitHub**
![AI Review](docs/screenshots/ai-review.png)

</td>
<td width="50%">

**Webhook Settings**
![Settings](docs/screenshots/settings.png)

</td>
</tr>
</table>

---

## 🧠 How the AI review pipeline works

1. Developer pushes a commit to an open PR
2. **GitHub Webhook** fires → hits DevFlow's Express API (hosted on Render)
3. DevFlow fetches the **full diff** via the GitHub REST API
4. The diff is sent to **Gemini 2.5 Flash** with a structured prompt, returning:
   - **Verdict** — Approve / Comment / Request Changes
   - **Summary** of the change
   - **Severity-tagged issues** — Critical / Major / Minor
   - **Suggestions** for improvement
5. The review is posted as a **PR comment** and upserted into PostgreSQL
6. The **Next.js dashboard** reflects updated analytics and sprint board state in real time

---

## 🛠 Tech Stack

**Frontend** — Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, Lucide Icons
**Backend** — Node.js, Express.js, PostgreSQL, JWT (access + refresh), Helmet, express-rate-limit
**AI** — Google Gemini API (`gemini-2.5-flash-lite`)
**Integrations** — GitHub REST API, GitHub OAuth, GitHub Webhooks
**Infra** — Render (API + Postgres), Vercel (frontend), Docker-ready

---

## 🚀 Running it locally

### Prerequisites
- Node.js 20+, PostgreSQL, ngrok
- GitHub OAuth App + fine-grained PAT (repo: contents read, pull requests read/write)
- Gemini API key (free — [aistudio.google.com/apikey](https://aistudio.google.com/apikey))

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`.

### Webhook (local dev)
```bash
ngrok http 5000
```
Add `<ngrok-url>/api/webhooks/github` as a webhook payload URL on your test repo, subscribed to **Pull requests**.

---

## 🗺 Roadmap

- [ ] Multi-file cross-reference analysis in AI review
- [ ] Slack/Discord notifications for review results
- [ ] Per-org team analytics
- [ ] GitHub App (vs OAuth App) for org-wide installs

---

## 📝 License

MIT © [Vikas Pandey](https://github.com/vikas1311code)
