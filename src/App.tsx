import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  createHashRouter,
  RouterProvider,
} from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import React, { Suspense, lazy, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

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
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import Community from "./pages/Community";

// Components
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

// Hooks
import { ThemeProvider } from "@/hooks/useTheme";
import AuthCallback from "./components/AuthCallback";

// Safe lazy loader to handle chunk failures
const safeLazy = (factory: () => Promise<{ default: React.ComponentType<any> }>) => {
  return lazy(() =>
    factory().catch(error => {
      if (error.message.includes("Failed to fetch dynamically imported module")) {
        console.warn("[App] Chunk load failed. Force reloading page to fetch new assets...");
        window.location.reload();
        return { default: () => <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div> };
      }
      throw error;
    })
  );
};

// Lazy load Admin module
const Admin = safeLazy(() => import("./pages/Admin"));

// App.tsx - Optimized routing
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
      <AdminProtectedRoute allowedRoles={['ops_admin', 'super_admin']}>
        <Suspense fallback={
          <div className="h-screen w-full flex items-center justify-center bg-background">
            <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
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
    element: <AuthCallback />,
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
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RouterProvider router={router} />
        <Analytics />
      </TooltipProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
