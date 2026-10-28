<div align="center">

# 🎓 KLE CONNECT

### Centralized Academic Collaboration & Student Resource Platform

[![Vite](https://img.shields.io/badge/Vite_7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Agora RTC](https://img.shields.io/badge/Agora_RTC-099DFD?style=for-the-badge&logo=agora&logoColor=white)](https://www.agora.io/)
[![Google Gemini](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

**KLE CONNECT** is an all-in-one academic and campus companion platform engineered for students and faculty at KLE Technological University / KLE Academy. It bridges classroom resource sharing, real-time peer communication, live virtual study rooms, and AI-assisted academic tutoring into a single responsive web portal.

[Features](#-core-features) • [Architecture](#-architectural-overview) • [Tech Stack](#-technical-stack) • [Getting Started](#-getting-started) • [Environment Variables](#-environment-variables)

</div>

---

## 🚀 Core Features

- **🔐 Authentication & RBAC**: Full user authentication and session management powered by **Supabase Auth**, featuring email/password sign-in, protected routes (`ProtectedRoute.tsx`), and role-gated admin access (`AdminProtectedRoute.tsx`).
- **📚 Collaborative Notes Repository**: Centralized study material library allowing students to browse, search, and syndicate lecture notes and syllabi organized hierarchically by department and semester.
- **🎥 Virtual Study Rooms (Agora RTC)**: Live collaborative video and audio study spaces powered by the **Agora RTC React SDK** (`agora-rtc-react`, `agora-rtc-sdk-ng`) with real-time room presence and state synchronization (`roomSync.ts`).
- **💬 Real-Time Community Channels**: Live student discussion channels (`#general`, `#academic`) built on **Supabase Realtime** for zero-latency messaging, active user presence, and peer networking.
- **❓ Doubts & Forum Q&A**: Academic question-and-answer platform enabling students to ask questions, post solutions with Markdown formatting, and upvote peer answers (`useForum.tsx`).
- **🎓 AI Academic Tutor**: Integrated AI tutor backed by the **Google Generative AI SDK** (`@google/generative-ai`) and OpenAI API for instantaneous academic doubt resolution and concept breakdown.
- **🤝 Senior Connect**: Direct mentorship portal connecting junior students with seniors and alumni for academic advice, subject tips, and placement guidance (`SeniorConnect.tsx`).
- **🗺️ Campus Navigator & Student Help**: Interactive campus navigation directory with coordinate points (`data/campus_points.json`) and vital university student support resources.
- **📊 Admin Telemetry & Analytics**: Administrative dashboard with real-time platform metrics, user management, and AI usage telemetry (`AIAnalytics.tsx`).

---

## 🏛️ Architectural Overview

```
src/
├── components/          # Reusable UI & Layout Components
│   ├── admin/           # Admin analytics & monitoring widgets
│   ├── dock/            # Interactive desktop dock navigation
│   ├── features/        # Feature modals (Study room booking, etc.)
│   ├── layout/          # Page layouts and global navigation wrappers
│   ├── settings/        # Profile, privacy, and password dialogs
│   └── ui/              # Radix UI primitives & Tailwind design components
├── contexts/            # System & Theme Context providers
├── data/                # Static data assets (campus_points.json)
├── hooks/               # Custom React hooks (useAuth, useCommunity, useForum, useChat)
├── lib/                 # Core service clients (supabase.ts, RealtimeManager.ts, security.ts)
├── pages/               # Application route views (Dashboard, Notes, StudyRooms, Doubts, etc.)
├── styles/              # Global animations and CSS styling
└── types/               # TypeScript interface definitions (supabase.ts, auth.ts)
```

---

## 🛠️ Technical Stack

| Layer | Technology |
|---|---|
| **Framework & Build** | [Vite 7](https://vitejs.dev/) + [React 18](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling & Animation** | [Tailwind CSS 3](https://tailwindcss.com/) + [Radix UI Primitives](https://www.radix-ui.com/) + [Framer Motion](https://www.framer.com/motion/) + [GSAP](https://greensock.com/) |
| **Backend & Database** | [Supabase](https://supabase.com/) (PostgreSQL Database, Supabase Auth, Supabase Realtime Channels) |
| **Video & Audio Calling** | [Agora RTC SDK](https://www.agora.io/) (`agora-rtc-react` v2.5, `agora-rtc-sdk-ng` v4.24) |
| **AI Integration** | [Google Generative AI SDK](https://ai.google.dev/) (`@google/generative-ai` v0.24) + [OpenAI SDK](https://platform.openai.com/) |
| **Data Visualization** | [Recharts](https://recharts.org/) + [Lucide React Icons](https://lucide.dev/) |
| **Routing & Forms** | [React Router DOM v7](https://reactrouter.com/) + [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |

---

## ⚙️ Environment Variables

Create a `.env` file in the project root based on [`.env.example`](.env.example):

```env
# ============================================================
# Supabase Configuration (Required)
# ============================================================
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_anon_key

# ============================================================
# Agora RTC Configuration (Required for Virtual Study Rooms)
# ============================================================
VITE_AGORA_APP_ID=your_agora_app_id
VITE_TOKEN_SERVER_URL=https://your-agora-token-server.com

# ============================================================
# AI Tutor Configuration (Optional - for AI Assistant)
# ============================================================
VITE_GEMINI_API_KEY=your_google_gemini_api_key
# VITE_AI_API_URL=https://your-domain.vercel.app/api/ai

# ============================================================
# Admin Configuration (Optional)
# ============================================================
VITE_PLATFORM_OWNER_EMAIL=admin@kle.edu
VITE_SECONDARY_ADMIN_EMAIL=coadmin@kle.edu
VITE_MASTER_ADMIN_PASSWORD=your_secure_admin_password
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm or bun

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/VAIBHAV7848/KLE_CONNECT.git
cd KLE_CONNECT
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Fill in your Supabase credentials and API keys in .env
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
npm run preview
```

### 5. Supabase Synchronization (Optional)
```bash
npm run sync:supabase
```

---

## 🔒 Security & Data Integrity

- **Row Level Security (RLS)**: Enforced across Supabase PostgreSQL tables ensuring students only modify their own profiles and contributions.
- **Client Sanitization**: All user-submitted Markdown in Doubts and Notes is sanitized before DOM injection to eliminate XSS risks (`security.ts`).
- **Protected Route Guards**: Client-side authentication checks gate all private student views (`ProtectedRoute.tsx`), with separate checks for administrative routes (`AdminProtectedRoute.tsx`).

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
