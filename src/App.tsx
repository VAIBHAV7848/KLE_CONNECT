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

// Pages
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import AITutor from "./pages/AITutor";
import Notes from "./pages/Notes";
import StudyPlanner from "./pages/StudyPlanner";
import StudyRooms from "./pages/StudyRooms";
import CampusMap from "./pages/CampusMap";
import Events from "./pages/Events";
import Doubts from "./pages/Doubts";
import SeniorConnect from "./pages/SeniorConnect";
import StudentHelp from "./pages/StudentHelp";
import SettingsPage from "./pages/Settings";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";

import ProtectedRoute from "./components/ProtectedRoute";

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
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </TooltipProvider>
    </AuthProvider>
  </ErrorBoundary>
);

export default App;
