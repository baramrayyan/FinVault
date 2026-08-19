<div align="center">

<img src="./public/logo.png" alt="FinVault logo" width="88" />

# FinVault

**A personal finance & money‑tracking PWA — built by vibe coding with AI.**

[![Live App](https://img.shields.io/badge/demo-live-4caf50)](https://baramrayyan.github.io/FinVault)
![Status](https://img.shields.io/badge/status-personal%20project-blue)
![Vibe Coded](https://img.shields.io/badge/built%20with-AI%20%2F%20vibe%20coding-ff69b4)

</div>

---

## About

FinVault is a mobile‑first, installable web app (PWA) for tracking personal income, expenses, savings goals, debts, and side accounts — with real‑time sync via Firebase.

> **Heads up:** this project was largely **"vibe coded"** — built by iterating with an AI coding assistant rather than a fully hand‑designed architecture. It works and is genuinely useful day‑to‑day, but it hasn't gone through a formal code review, test suite, or security audit. Treat it as a personal/portfolio project rather than production‑grade software.

## Features

- 📊 **Dashboard** — monthly income, expenses, and remaining balance at a glance
- ➕ **Transactions** — add/edit income, expenses, and savings entries with custom categories
- 🎯 **Savings goals** — track progress toward a target amount, with goal completion history
- 💳 **Debt manager** — track money owed/owed to you, with a settled/history view
- 🏦 **Side accounts** — separate ledgers for side projects or secondary accounts
- 🧾 **Receipts** — generate a receipt/summary and export it as a PDF (`html2pdf.js`)
- 📈 **Stats** — visual breakdowns of spending and trends
- 🔐 **Auth** — email/password sign‑up, login, and email verification via Firebase Auth
- 🌗 **Settings** — theme (light/dark), currency, and category customization, synced per user
- 📱 **PWA** — installable on mobile/desktop with offline app‑shell support (`vite-plugin-pwa`)

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| Backend / Data | Firebase (Auth + Firestore, real‑time listeners) |
| Icons | lucide-react |
| PDF export | html2pdf.js + canvg |
| Sanitization | DOMPurify |
| PWA | vite-plugin-pwa |
| Hosting | GitHub Pages (`gh-pages`) |

## Getting Started

```bash
# 1. Clone
git clone https://github.com/baramrayyan/FinVault.git
cd FinVault

# 2. Install dependencies
npm install

# 3. Configure Firebase
# Create a Firebase project (Auth + Firestore enabled), then update
# src/firebase.js with your own project's config.

# 4. Run locally
npm run dev
```

### Deploying

```bash
npm run build     # production build to /dist
npm run deploy     # commit + push + build + publish to GitHub Pages
```

## Project Structure

```
src/
├── components/       # Screens & UI (Dashboard, Savings, DebtManager, Stats, etc.)
├── context/           # React context: AuthContext, FinanceContext (Firestore data + actions)
├── firebase.js        # Firebase app init (Auth + Firestore)
├── App.jsx            # Routes
└── main.jsx           # Entry point
```

## License

No license specified yet — all rights reserved by default until one is added.
