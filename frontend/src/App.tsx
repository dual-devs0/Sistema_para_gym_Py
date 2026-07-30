import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import Router from "./router";
import { useAuthStore } from "./store/authStore";

function AuthLoader({ children }: { children: React.ReactNode }) {
  const loadUser = useAuthStore((s) => s.loadUser);
  useEffect(() => { loadUser(); }, [loadUser]);
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthLoader>
        <Router />
      </AuthLoader>
    </BrowserRouter>
  );
}
