# KLE CONNECT

## Project Info

**KLE CONNECT** is the ultimate college companion platform designed for students. It features authentication, an Advanced tutor, study material planning, campus navigation, and detailed student resources.

## Features

- **Authentication**: Secure login and signup flows.
- **Dashboard**: Overview of study stats and quick actions.
- **AI Tutor**: Integrated AI for academic assistance.
- **Campus Map**: Interactive visualization of the campus.
- **Study Planner**: Tools to organize your schedule.
- **Notes & Resources**: Access to important study materials.

## Getting Started

1. **Clone the repository**:
   ```sh
   git clone <YOUR_GIT_URL>
   ```

2. **Install dependencies**:
   ```sh
   npm install
   ```

3. **Copy env template and fill values**:
   ```sh
   cp .env.example .env
   # add Supabase keys, AI endpoint, Agora APP_ID, token server URL
   ```

4. **Run the development server**:
   ```sh
   npm run dev
   ```

## Technologies Used

- **Vite**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Shadcn UI**
- **Firebase** (Authentication & Hosting)
- **Groq (LLM)** via `/api/ai`

## Deployment

Primary: Firebase Hosting (static) + Vercel-style serverless route `/api/ai` for Groq.
Run `npm run build` followed by `firebase deploy` for the frontend. Deploy `/api/ai` on your serverless host (e.g., Vercel) and set `VITE_AI_API_URL` to that URL.

### Environment variables

- Supabase: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- AI backend: `VITE_AI_API_URL` (points to `/api/ai` you deploy), `GROQ_API_KEY` on the serverless host
- Agora Study Rooms: `VITE_AGORA_APP_ID`, `VITE_TOKEN_SERVER_URL`
