import { Route, Routes, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import MembersPage from "./pages/members/MembersPage";
import MembershipsPage from "./pages/memberships/MembershipsPage";
import PaymentsPage from "./pages/payments/PaymentsPage";
import AttendancePage from "./pages/attendance/AttendancePage";
import SettingsPage from "./pages/settings/SettingsPage";
import ProfilePage from "./pages/profile/ProfilePage";
import PageLayout from "./components/layout/PageLayout";
import { useAuth } from "./hooks/useAuth";
import { allowedNavPaths, canViewGymSettings, defaultRouteForRole } from "./utils/roles";

// Roles without dashboard.view (receptionist, trainer) would otherwise land
// on "/" and get a 403 from every dashboard endpoint. Send them to whatever
// they can actually use instead.
function RoleHome() {
  const { user } = useAuth();
  if (user && !allowedNavPaths(user.role).includes("/")) {
    return <Navigate to={defaultRouteForRole(user.role)} replace />;
  }
  return <DashboardPage />;
}

// gym.settings.read is owner/admin only on the backend — don't let other
// roles land on a form that will 403 on submit.
function GuardedSettings() {
  const { user } = useAuth();
  if (user && !canViewGymSettings(user.role)) {
    return <Navigate to={defaultRouteForRole(user.role)} replace />;
  }
  return <SettingsPage />;
}

export default function Router() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route element={<PageLayout />}>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoleHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/members"
          element={
            <ProtectedRoute>
              <MembersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/memberships"
          element={
            <ProtectedRoute>
              <MembershipsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <PaymentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <AttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <GuardedSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}