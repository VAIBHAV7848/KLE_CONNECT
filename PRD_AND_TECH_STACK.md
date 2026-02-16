# KLE CONNECT - Product Requirements Document (PRD) & Technology Stack

## 1. Executive Summary
KLE CONNECT is a comprehensive "college companion" web application designed to enhance the student experience. It integrates academic tools, social connectivity, and Advanced assistance into a single unified platform. The goal is to drive student engagement through real-time collaboration, instant access to resources, and personalized study planning.

## 2. Product Requirements Document (PRD)

### 2.1. Mission & Goals
*   **Centralize Academic Resources:** Collaborative notes and past year questions (PYQs).
*   **Enhance Student Collaboration:** Real-time chat, study rooms, and forums.
*   **Personalize Learning:** AI-driven tutoring and study planning.
*   **Streamline Campus Info:** Events, announcements, and maps.

### 2.2. Target Audience
*   **Primary:** Students (Undergraduate/Postgraduate).
*   **Secondary:** Faculty/Admins (for content moderation, announcements, and oversight).

### 2.3. Core Features (Current Status)

| Feature | Description | Status |
| :--- | :--- | :--- |
| **Authentication** | Secure Email/Password login & signup via Supabase Auth. Includes role-based access (Student vs Admin). | ✅ Implemented |
| **Dashboard** | Personalized landing page with quick actions, stats (AI chats, study hours), and global campus announcements. | ✅ Implemented |
| **AI Tutor** | Conversational AI assistant for academic help, powered by Google Analytics Engine/Internal API. | ✅ Implemented |
| **Real-Time Community** | Chat system with channels (#general, etc.) for student interaction using Supabase Realtime. | ✅ Implemented |
| **Collaborative Notes** | Shared space for uploading and viewing study materials/notes with real-time updates. | ✅ Implemented |
| **Study Planner** | Task management tool to track daily academic goals and progress. Currently uses LocalStorage. | ⚠️ Basic / MVP |
| **Events** | Showcase of upcoming campus activities and workshops. | ⚠️ Static Mock |
| **Admin Panel** | Dedicated dashboard for `ops_admin` and `super_admin` to manage the platform. | ✅ Implemented |

### 2.4. Planned / Future Features
*   **Academic Calendar:** A dynamic calendar synced with the database for exams and college schedules (currently static/planned).
*   **Grade Tracker:** Visualization of SGPA/CGPA trends over semesters.
*   **Virtual Study Rooms:** Video/Audio study sessions using Agora SDK (Integration present in dependencies, needs full verification).
*   **Senior Connect:** Mentorship matching system.

### 2.5. User Roles & Permissions
*   **Student:** Access to all public features (Chat, Notes, AI, Planner).
*   **Admin:** Access to `/admin` route for system metrics and announcement management.

---

## 3. Technology Stack

### 3.1. Frontend (The "View")
*   **Framework:** **React 18**
*   **Build Tool:** **Vite 7** (High-performance build & dev server)
*   **Language:** **TypeScript 5.8** (Strict type safety)
*   **Routing:** **React Router DOM 7** (using `createHashRouter` for static hosting compatibility)

### 3.2. User Interface (UI) & Styling
*   **Design System:** **Shadcn UI** (built on Radix UI primitives)
*   **Styling Engine:** **Tailwind CSS 3.4**
*   **Icons:** **Lucide React**
*   **Animations:** `framer-motion` (complex transitions), `gsap` (GreenSock), `tailwindcss-animate`
*   **Charts:** `recharts` (for analytics and grade tracking)

### 3.3. Backend & Data (The "Model")
*   **BaaS (Backend-as-a-Service):** **Supabase**
    *   **Database:** PostgreSQL
    *   **Auth:** Supabase Auth (JWT handling)
    *   **Realtime:** Supabase Realtime (WebSockets for Chat/Notes)
*   ***Note:** Documentation mentions Firebase interchangeably in older files, but the codebase confirms Supabase is the active backend.*

### 3.4. AI & Intelligence
*   **LLM Providers:**
    *   **Google Generative AI** (Analytics Engine models)
    *   **Internal API** (GPT models)
*   **Integration:** Direct API calls via backend proxies or client-side keys (dependent on env config).

### 3.5. Real-Time Communication (Audio/Video)
*   **SDK:** **Agora RTC** (`agora-rtc-react`, `agora-rtc-sdk-ng`)
*   **Usage:** For the "Study Rooms" feature to enable voice/video channels.

### 3.6. Utilities & State Management
*   **Forms:** `react-hook-form` + `zod` (Schema validation)
*   **Date Handling:** `date-fns`
*   **Avatars:** `boring-avatars`

### 3.7. Deployment & DevOps
*   **Hosting:** Configured for **Firebase Hosting** (static frontend) or **Vercel**
*   **Analytics:** `@vercel/analytics`
*   **Linting:** ESLint 9 + TypeScript-ESLint

## 4. Developer Notes / Observations
*   **Configuration Inconsistency:** There is a discrepancy between `README.md` (which claims Firebase) and the code (which uses Supabase). The project should normally prioritize Supabase as the source of truth for data and auth.
*   **LocalStorage usage:** The `Study Planner` currently saves data to the browser's LocalStorage, meaning data won't sync across devices. This is a candidate for migration to Supabase.
*   **Static Content:** The `Events` page currently displays hardcoded data and needs to be connected to the backend.
