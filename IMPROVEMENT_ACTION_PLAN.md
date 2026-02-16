# 🚀 KLE CONNECT - Improvement Action Plan

This document outlines the strategic steps to elevate KLE CONNECT from an MVP to a production-grade platform.

## 🔴 Priority 1: Critical Architecture Fixes (Stability & Data Hygiene)
*   [ ] **Fix Identity Crisis**: 
    *   Update `README.md` to explicitly state **Supabase** is the backend (remove Firebase mentions if unused).
    *   Audit `package.json` to remove unused Firebase dependencies.
*   [ ] **Migrate Study Planner to Database**:
    *   Current: Tasks are stuck in `localStorage`.
    *   Action: Create a `tasks` table in Supabase (cols: `id`, `user_id`, `title`, `completed`, `due_date`).
    *   Action: Update `StudyPlanner.tsx` to read/write from Supabase.
*   [ ] **Connect Events to Real Data**:
    *   Current: `Events.tsx` uses hardcoded static data.
    *   Action: Create an `events` table in Supabase.
    *   Action: Fetch events dynamically so Admins can update them without code deploys.

## 🟡 Priority 2: Feature Enhancements (Engagement & Value)
*   [ ] **Gamification (Daily Streak)**:
    *   Add a logic to track consecutive login days in the `users` table.
    *   Display a 🔥 icon with the streak count on the `Dashboard` to boost retention.
*   [ ] **Robust Study Rooms**:
    *   Verify `token-server` logic in `StudyRooms.tsx`.
    *   Add a simple text chat side-panel inside the video room for sharing links.
*   [ ] **Senior Connect Logic**:
    *   Implement the backend logic for `/senior-connect` to actually match Junior requests with Senior profiles based on tags (e.g., "Web Dev", "AI").

## 🟢 Priority 3: Code Quality & DX (Maintenance)
*   [ ] **Strict Type Safety**:
    *   Create a `src/types/db.ts` file to define interfaces for `User`, `Event`, `Task`, `Room`.
    *   Replace random `any` types with these strict interfaces.
*   [ ] **Add Basic Testing**:
    *   Install **Vitest** or **Jest**.
    *   Write unit tests for critical utility functions (e.g., GPA calculator, Date formatters).
*   [ ] **Accessibility (a11y) Check**:
    *   Ensure all icon-only buttons (in Chat/Video) have `aria-label` attributes for screen readers.

## 🔵 Priority 4: UI/UX Polish (The "Wow" Factor)
*   [ ] **Skeleton Loading States**:
    *   Replace spinning loaders with "Skeleton" UI (shimmering shapes) during data fetch.
*   [ ] **Mobile Responsiveness**:
    *   Test the `LiveMeeting` grid on mobile dimensions to ensure video tiles don't break the layout.

---
**Next Step:** Pick one item from **Priority 1** to start with tomorrow! 
