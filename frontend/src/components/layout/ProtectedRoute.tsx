import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuth, loadUser } = useAuth();

  useEffect(() => {
    if (isAuth) {
      loadUser();
    }
  }, [isAuth, loadUser]);

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}