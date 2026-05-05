import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Homepage from "./pages/Homepage";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import OrgDashboard from "./pages/OrgDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PendingApproval from "./pages/PendingApproval";
import Header from "./components/Header";

// Redirect /dashboard to the correct role-based dashboard
function DashboardRedirect() {
  const { profile, loading } = useAuth();
  if (loading) return <div className="status-message">Loading...</div>;
  if (!profile) return <Navigate to="/" />;
  if (profile.role === "admin") return <Navigate to="/dashboard/admin" />;
  if (profile.role === "organization") return <Navigate to="/dashboard/organization" />;
  if (profile.role === "volunteer") return <Navigate to="/dashboard/volunteer" />;
  return <Navigate to="/" />;
}

// Protected route that checks auth + role + status
function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="status-message">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (!profile) return <div className="status-message">No profile data</div>;

  if (profile.status !== "approved" && profile.role !== "admin") {
    if (profile.role === "organization") return <Navigate to="/pending" />;
    return <PendingApproval />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <div className="error">403 – Access Denied</div>;
  }
  return children;
}

export default function App() {
  return (
    <>
      <Header />
      <main className="main-container">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/needs/:id" element={<div>Need detail page</div>} />
          <Route path="/dashboard" element={<DashboardRedirect />} />

          <Route
            path="/dashboard/volunteer"
            element={
              <ProtectedRoute allowedRoles={["volunteer"]}>
                <VolunteerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/organization"
            element={
              <ProtectedRoute allowedRoles={["organization"]}>
                <OrgDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/pending" element={<PendingApproval />} />
          {/* optional routes for login/register (just show homepage with modal) */}
          <Route path="/register" element={<Homepage />} />
          <Route path="/login" element={<Homepage />} />
        </Routes>
      </main>
    </>
  );
}