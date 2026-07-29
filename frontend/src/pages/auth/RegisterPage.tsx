import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, fullName);
      navigate("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrarse";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary opacity-5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm mx-4">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: "28px" }}>fitness_center</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Crear cuenta</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Registrá tu gimnasio para empezar</p>
        </div>

        <div className="rounded-2xl bg-surface-container border border-outline-variant p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Nombre completo"
              type="text"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre o el del gimnasio"
              required
              autoComplete="name"
            />
            <Input
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gympro.com"
              required
              autoComplete="email"
            />
            <Input
              label="Contraseña"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-error-container/20 border border-error/20 px-3 py-2">
                <span className="material-symbols-outlined text-error shrink-0" style={{ fontSize: "16px" }}>error</span>
                <p className="text-xs text-error">{error}</p>
              </div>
            )}

            <Button type="submit" loading={loading} fullWidth className="mt-2">
              Crear cuenta
            </Button>
          </form>

          <p className="text-center mt-6 text-xs text-on-surface-variant">
            ¿Ya tenés cuenta?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Iniciar sesión
            </Link>
          </p>
        </div>

        <p className="text-center mt-6 text-xs text-on-surface-variant">
          GymPro Admin Console &mdash; v2.4.0
        </p>
      </div>
    </div>
  );
}
