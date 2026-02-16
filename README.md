# KLE CONNECT

## Project Info

**KLE CONNECT** is the ultimate college companion platform designed for students. It features authentication, an Advanced tutor, study material planning, campus navigation, and detailed student resources.

## Key Features

- **🔐 Secure Authentication**: Robust login/signup flow powered by **Supabase Auth**.
- **💬 Real-Time Community**: Live chat channels (#general, #academic) with instant messaging via **Supabase Realtime**.
- **📚 Collaborative Notes**: Shared repository for study materials and notes, accessible to all peers.
- **🎓 AI Tutor**: Intelligent academic assistant powered by **Google Analytics Engine** for instant concept clarification.
- **🎥 Virtual Study Rooms**: Live audio/video study sessions powered by **Agora RTC**, enabling remote group study.
- **📅 Study Planner**: Personal task management to organize academic schedules (Local-first).
- **🗺️ Campus Map**: Interactive navigation guide for the college campus.
- **📊 Admin Dashboard**: Dedicated portal for administrators to manage users, announcements, and system health.

## Getting Started

1. **Clone the repository**:
   ```sh
   git clone <YOUR_GIT_URL>
   ```

2. **Install dependencies**:
   ```sh
   npm install
   ```

3. **Configure Environment**:
   Copy `.env.example` to `.env` and fill in your credentials:
   ```sh
   cp .env.example .env
   # Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
   # Optional: VITE_AGORA_APP_ID, VITE_GEMINI_API_KEY
   ```

4. **Run the development server**:
   ```sh
   npm run dev
   ```

## Technologies Used

### Frontend
- **React 18** (Vite)
- **TypeScript**
- **Tailwind CSS** & **Shadcn UI** (Styling)
- **Framer Motion** (Animations)

### Backend & Services
- **Supabase**: 
  - **Auth**: User management & RLS policies.
  - **Database**: PostgreSQL for structured data.
  - **Realtime**: WebSocket subscriptions for Chat & Notes.
- **Google Analytics Engine**: AI Model integration.
- **Agora RTC**: Real-time voice and video communication.

## Deployment

Primary: **Vercel** (Recommended) or GitHub Pages.

### Vercel Deployment
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` to deploy.
3. Add your environment variables in the Vercel Dashboard.

### GitHub Pages
1. Update `homepage` in `package.json`
2. Run `npm run deploy`

### Environment variables

- **Supabase**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Required for Auth/DB)
- **Agora**: `VITE_AGORA_APP_ID`, `VITE_TOKEN_SERVER_URL` (For Video Rooms)
- **AI**: `VITE_GEMINI_API_KEY` (Direct integration) or `VITE_AI_API_URL` (Proxy)
