import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  createHashRouter,
  RouterProvider,
  Outlet
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { Analytics } from "@vercel/analytics/react";

// Pages
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import AITutor from "./pages/AITutor";
import ThinkLM from "./pages/ThinkLM";
import Notes from "./pages/Notes";
import StudyPlanner from "./pages/StudyPlanner";
import StudyRooms from "./pages/StudyRooms";
import CampusMap from "./pages/CampusMap";
import Events from "./pages/Events";
import Doubts from "./pages/Doubts";
import SeniorConnect from "./pages/SeniorConnect";
import StudentHelp from "./pages/StudentHelp";
import SettingsPage from "./pages/Settings";
import React, { Suspense, lazy } from "react";
// ... other imports

// Lazy load Admin module
const Admin = lazy(() => import("./pages/Admin"));
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import Community from "./pages/Community";

const router = createHashRouter([
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <AdminProtectedRoute>
        <Suspense fallback={
          <div className="h-screen w-full flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <Admin />
        </Suspense>
      </AdminProtectedRoute>
    ),
  },
  {
    path: "/ai-tutor",
    element: (
      <ProtectedRoute>
        <AITutor />
      </ProtectedRoute>
    ),
  },
  {
    path: "/ai_tutor",
    element: (
      <ProtectedRoute>
        <AITutor />
      </ProtectedRoute>
    ),
  },
  {
    path: "/thinklm",
    element: (
      <ProtectedRoute>
        <ThinkLM />
      </ProtectedRoute>
    ),
  },
  {
    path: "/notes",
    element: (
      <ProtectedRoute>
        <Notes />
      </ProtectedRoute>
    ),
  },
  {
    path: "/planner",
    element: (
      <ProtectedRoute>
        <StudyPlanner />
      </ProtectedRoute>
    ),
  },
  {
    path: "/study-rooms",
    element: (
      <ProtectedRoute>
        <StudyRooms />
      </ProtectedRoute>
    ),
  },
  {
    path: "/campus-map",
    element: (
      <ProtectedRoute>
        <CampusMap />
      </ProtectedRoute>
    ),
  },
  {
    path: "/events",
    element: (
      <ProtectedRoute>
        <Events />
      </ProtectedRoute>
    ),
  },
  {
    path: "/doubts",
    element: (
      <ProtectedRoute>
        <Doubts />
      </ProtectedRoute>
    ),
  },
  {
    path: "/senior-connect",
    element: (
      <ProtectedRoute>
        <SeniorConnect />
      </ProtectedRoute>
    ),
  },
  {
    path: "/community",
    element: (
      <ProtectedRoute>
        <Community />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student-help",
    element: (
      <ProtectedRoute>
        <StudentHelp />
      </ProtectedRoute>
    ),
  },
  {
    path: "/support",
    element: (
      <ProtectedRoute>
        <Support />
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
], {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});


const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
          <Analytics />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
