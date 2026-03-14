import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ExamList from "./pages/ExamList";
import ExamCreate from "./pages/ExamCreate";
import ExamView from "./pages/ExamView";
import ExamTake from "./pages/ExamTake";
import AIGenerator from "./pages/AIGenerator";
import QuestionBank from "./pages/QuestionBank";
import Students from "./pages/Students";
import Settings from "./pages/Settings";
import Institutions from "./pages/Institutions";
import Analytics from "./pages/Analytics";
import AcademyHome from "./pages/AcademyHome";
import AcademyCourseDetail from "./pages/AcademyCourseDetail";
import AcademyManage from "./pages/AcademyManage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/exams"
              element={<ProtectedRoute><ExamList /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/exams/create"
              element={<ProtectedRoute><ExamCreate /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/ai"
              element={<ProtectedRoute><AIGenerator /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/questions"
              element={<ProtectedRoute><QuestionBank /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/students"
              element={<ProtectedRoute><Students /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/settings"
              element={<ProtectedRoute><Settings /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/institutions"
              element={<ProtectedRoute><Institutions /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/analytics"
              element={<ProtectedRoute><Analytics /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/exams/:examId"
              element={<ProtectedRoute><ExamView /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/exams/:examId/edit"
              element={<ProtectedRoute><ExamCreate /></ProtectedRoute>}
            />
            <Route
              path="/exam/:examId/take"
              element={<ProtectedRoute><ExamTake /></ProtectedRoute>}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
