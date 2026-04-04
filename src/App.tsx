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
import AcademyCourseCreate from "./pages/AcademyCourseCreate";
import AcademyManage from "./pages/AcademyManage";
import CertificationsAdmin from "./pages/CertificationsAdmin";
import VerifyPortal from "./pages/VerifyPortal";
import InternCertVerify from "./pages/InternCertVerify";
import RoleManagement from "./pages/RoleManagement";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Careers from "./pages/Careers";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogManage from "./pages/BlogManage";
import BlogEditor from "./pages/BlogEditor";
import Assignments from "./pages/Assignments";
import AssignmentCreate from "./pages/AssignmentCreate";
import AssignmentDetail from "./pages/AssignmentDetail";
import AdminRecover from "./pages/AdminRecover";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public verification routes — NO auth provider */}
          <Route path="/verify" element={<VerifyPortal />} />
          <Route path="/verify/:certificateId" element={<InternCertVerify />} />
        </Routes>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/exams"
              element={<ProtectedRoute allowedRoles={["super_admin", "institute_admin", "instructor", "student"]}><ExamList /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/exams/create"
              element={<ProtectedRoute allowedRoles={["super_admin", "instructor"]}><ExamCreate /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/ai"
              element={<ProtectedRoute allowedRoles={["super_admin", "instructor"]}><AIGenerator /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/questions"
              element={<ProtectedRoute allowedRoles={["super_admin", "instructor", "student"]}><QuestionBank /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/students"
              element={<ProtectedRoute allowedRoles={["super_admin", "institute_admin", "instructor"]}><Students /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/settings"
              element={<ProtectedRoute><Settings /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/institutions"
              element={<ProtectedRoute allowedRoles={["super_admin", "institute_admin"]}><Institutions /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/analytics"
              element={<ProtectedRoute allowedRoles={["super_admin", "institute_admin", "instructor"]}><Analytics /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/exams/:examId"
              element={<ProtectedRoute><ExamView /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/exams/:examId/edit"
              element={<ProtectedRoute allowedRoles={["super_admin", "instructor"]}><ExamCreate /></ProtectedRoute>}
            />
            <Route
              path="/exam/:examId/take"
              element={<ProtectedRoute><ExamTake /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/academy"
              element={<ProtectedRoute><AcademyHome /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/academy/course/:courseId"
              element={<ProtectedRoute><AcademyCourseDetail /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/academy/create"
              element={<ProtectedRoute allowedRoles={["super_admin", "institute_admin", "instructor"]}><AcademyCourseCreate /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/academy/manage"
              element={<ProtectedRoute allowedRoles={["super_admin", "institute_admin", "instructor"]}><AcademyManage /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/certs"
              element={<ProtectedRoute allowedRoles={["super_admin", "institute_admin"]}><CertificationsAdmin /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/roles"
              element={<ProtectedRoute allowedRoles={["super_admin", "institute_admin"]}><RoleManagement /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/blog"
              element={<ProtectedRoute allowedRoles={["super_admin", "institute_admin"]}><BlogManage /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/blog/new"
              element={<ProtectedRoute allowedRoles={["super_admin", "institute_admin"]}><BlogEditor /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/blog/:postId/edit"
              element={<ProtectedRoute allowedRoles={["super_admin", "institute_admin"]}><BlogEditor /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/assignments"
              element={<ProtectedRoute allowedRoles={["super_admin", "institute_admin", "instructor", "student"]}><Assignments /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/assignments/create"
              element={<ProtectedRoute allowedRoles={["super_admin", "institute_admin", "instructor"]}><AssignmentCreate /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/assignments/:assignmentId"
              element={<ProtectedRoute allowedRoles={["super_admin", "institute_admin", "instructor", "student"]}><AssignmentDetail /></ProtectedRoute>}
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
