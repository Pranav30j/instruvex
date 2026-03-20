import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import InstructorDashboard from "@/components/dashboard/InstructorDashboard";
import InstituteAdminDashboard from "@/components/dashboard/InstituteAdminDashboard";
import SuperAdminDashboard from "@/components/dashboard/SuperAdminDashboard";

const Dashboard = () => {
  const { profile, activeRole } = useAuth();

  const displayName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
    : profile?.email || "User";

  const renderDashboard = () => {
    switch (activeRole) {
      case "super_admin":
        return <SuperAdminDashboard displayName={displayName} />;
      case "institute_admin":
        return <InstituteAdminDashboard displayName={displayName} />;
      case "instructor":
        return <InstructorDashboard displayName={displayName} />;
      case "student":
        return <StudentDashboard displayName={displayName} />;
      case "academy_learner":
      default:
        return <StudentDashboard displayName={displayName} />;
    }
  };

  return <DashboardLayout>{renderDashboard()}</DashboardLayout>;
};

export default Dashboard;
