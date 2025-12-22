import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";

import ProtectedRoute from "./components/ProtectedRoute";

const App = () => (
  <ErrorBoundary>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/auth" element={<Auth />} />

              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/ai-tutor" element={
                <ProtectedRoute>
                  <AITutor />
                </ProtectedRoute>
              } />
              <Route path="/notes" element={
                <ProtectedRoute>
                  <Notes />
                </ProtectedRoute>
              } />
              <Route path="/planner" element={
                <ProtectedRoute>
                  <StudyPlanner />
                </ProtectedRoute>
              } />
              <Route path="/study-rooms" element={
                <ProtectedRoute>
                  <StudyRooms />
                </ProtectedRoute>
              } />
              <Route path="/campus-map" element={
                <ProtectedRoute>
                  <CampusMap />
                </ProtectedRoute>
              } />
              <Route path="/events" element={
                <ProtectedRoute>
                  <Events />
                </ProtectedRoute>
              } />
              <Route path="/doubts" element={
                <ProtectedRoute>
                  <Doubts />
                </ProtectedRoute>
              } />
              <Route path="/senior-connect" element={
                <ProtectedRoute>
                  <SeniorConnect />
                </ProtectedRoute>
              } />
              <Route path="/student-help" element={
                <ProtectedRoute>
                  <StudentHelp />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </ErrorBoundary>
);

export default App;
