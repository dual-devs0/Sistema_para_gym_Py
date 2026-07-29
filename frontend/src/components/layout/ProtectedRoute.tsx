import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuth, fetchUser } = useAuth();

  useEffect(() => {
    if (isAuth) {
      fetchUser();
    }
  }, [isAuth, fetchUser]);

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}