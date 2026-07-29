import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Credenciales inválidas. Verifica tu email y contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary opacity-5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[28rem] mx-auto px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: "32px" }}>fitness_center</span>
          </div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">GymPro</h1>
          <p className="mt-2 text-sm text-on-surface-variant text-center">
            Ingresá con las credenciales que te compartió el equipo de GymPro.
          </p>
        </div>

        {/* Card */}
        <div className="animate-slide-in-up rounded-2xl bg-surface-container border border-outline-variant px-lg py-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gymPro.com"
              required
              autoComplete="email"
            />
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="font-label-caps text-label-caps text-on-surface-variant">
                  Contraseña
                </label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-error-container/20 border border-error/20 px-3 py-2">
                <span className="material-symbols-outlined text-error shrink-0" style={{ fontSize: "16px" }}>error</span>
                <p className="text-xs text-error">{error}</p>
              </div>
            )}

            <Button type="submit" loading={loading} fullWidth className="mt-2">
              Iniciar sesión
            </Button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs text-on-surface-variant">
          GymPro Admin Console &mdash; v2.4.0
        </p>
      </div>
    </div>
  );
}
