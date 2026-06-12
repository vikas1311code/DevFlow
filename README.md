# DevFlow 🚀

**AI-powered pull request reviewer, sprint board, and analytics dashboard for developer teams.**

DevFlow listens to GitHub webhooks, automatically reviews every pull request using AI (Gemini), posts structured feedback as a PR comment, and gives teams a live dashboard with sprint tracking and analytics.

## ✨ Features

- **AI Code Review** — Every PR opened/updated triggers an automated review (summary, issues, suggestions) posted directly as a GitHub comment.
- **GitHub OAuth + JWT Auth** — Secure login with GitHub, JWT access + refresh tokens, role-based access control.
- **Webhook Integration** — Real-time PR event ingestion via GitHub webhooks (signature-verifiable).
- **Sprint Board** — Kanban-style task board (Open / In Progress / Done) synced per repository.
- **Analytics Dashboard** — PR stats, AI review coverage, diff sizes, and sprint distribution charts.
- **Security-hardened API** — Helmet, rate limiting, CORS, RBAC middleware.

## 🛠 Tech Stack

**Backend**: Node.js, Express.js, PostgreSQL, JWT, Helmet, express-rate-limit
**Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, Lucide Icons
**AI**: Google Gemini API
**Integrations**: GitHub REST API, GitHub Webhooks
**Infra**: Docker-ready, deployable to Render (backend) + Vercel (frontend)

## 📐 Architecture
Developer pushes PR
↓
GitHub Webhook → DevFlow API (Express)
↓
Fetch PR diff via GitHub API
↓
Send diff → Gemini AI for review
↓
Post structured review as PR comment
↓
Store PR + review metadata in PostgreSQL
↓
Dashboard (Next.js) → Analytics + Sprint Board

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL
- ngrok (for local webhook testing)
- GitHub OAuth App + Personal Access Token
- Gemini API key (free at [aistudio.google.com](https://aistudio.google.com/apikey))

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in your credentials
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`.

### Webhook Setup
1. Run `ngrok http 5000`
2. Add webhook in your GitHub repo settings → Payload URL: `<ngrok-url>/api/webhooks/github`
3. Select "Pull requests" events

## 📊 Screenshots

_See `/docs` for dashboard screenshots._

## 📝 License

MIT
