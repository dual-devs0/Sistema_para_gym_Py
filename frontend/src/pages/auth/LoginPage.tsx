import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import api from "../../services/api";
import gymHero from "../../assets/gym-hero.jpg";

interface DashboardSummary {
  revenue_today: number;
  revenue_month: number;
  active_members: number;
  new_members_month: number;
  checkins_today: number;
  members_expiring_soon: number;
}

async function fetchSummary(): Promise<DashboardSummary> {
  const { data } = await api.get("/dashboard/summary");
  return data;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatLastLogin(iso: string | null | undefined) {
  if (!iso) return null;
  const date = new Date(iso);
  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const { data: summary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: fetchSummary,
    retry: false,
    staleTime: 60_000,
  });

  const lastLoginText = formatLastLogin(user?.last_login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      setTransitioning(true);
      setTimeout(() => navigate("/"), 550);
    } catch {
      setError("Credenciales inválidas. Verificá tu usuario y contraseña.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Panel - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={transitioning ? { x: "-100%", opacity: 0 } : { x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
          className="flex flex-col items-center justify-center px-4 py-12 relative z-10 bg-background"
        >
          <div className="w-full max-w-[28rem]">
            <div className="flex flex-col items-center mb-10">
              <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">GymPro</h1>
              <p className="mt-3 text-sm text-on-surface-variant text-center max-w-md">
                Accedé a la consola de administración con tus credenciales.
              </p>
            </div>

            <div className="rounded-2xl bg-surface-container border border-outline-variant px-8 py-8 shadow-xl">
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Usuario"
                  type="text"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin.gympro"
                  required
                  autoComplete="username"
                />

                <Input
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-on-surface-variant hover:text-on-surface transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  }
                />

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-error-container/20 border border-error/20 px-3 py-2">
                    <span className="material-symbols-outlined text-error shrink-0" style={{ fontSize: "16px" }}>
                      error
                    </span>
                    <p className="text-xs text-error">{error}</p>
                  </div>
                )}

                <Button type="submit" loading={loading} fullWidth className="mt-1">
                  Iniciar sesión
                </Button>
              </form>
            </div>

            <div className="text-center mt-8 space-y-1">
              <p className="text-xs text-on-surface-variant">GymPro Admin Console — v2.4.0</p>
              {lastLoginText && (
                <p className="text-[11px] text-on-surface-variant/70">
                  Último ingreso: {lastLoginText}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Right Panel - Hero with Image & Live Stats */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={transitioning ? { x: "100%", opacity: 0 } : { x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
          className="hidden lg:block relative overflow-hidden"
        >
          <img
            src={gymHero}
            alt="Gimnasio"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/50" />

          <div className="relative z-10 h-full flex flex-col justify-between px-12 py-16">
            <div>
              <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-3">
                Panel en vivo
              </p>
              <h2 className="text-4xl font-bold text-on-surface leading-[1.15] tracking-tight max-w-[24rem]">
                Todo tu gimnasio, en un solo lugar.
              </h2>
            </div>

            {summary && (
              <div className="grid grid-cols-2 gap-4 max-w-[28rem]">
                <div className="rounded-xl bg-surface-container/90 backdrop-blur border border-outline-variant/50 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Ingresos hoy</p>
                  <p className="text-xl font-bold text-on-surface font-data-mono mt-1">
                    {formatCurrency(summary.revenue_today)}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-container/90 backdrop-blur border border-outline-variant/50 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Miembros activos</p>
                  <p className="text-xl font-bold text-on-surface font-data-mono mt-1">
                    {summary.active_members}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-container/90 backdrop-blur border border-outline-variant/50 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Check-ins hoy</p>
                  <p className="text-xl font-bold text-on-surface font-data-mono mt-1">
                    {summary.checkins_today}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-container/90 backdrop-blur border border-outline-variant/50 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Por vencer</p>
                  <p className="text-xl font-bold text-tertiary font-data-mono mt-1">
                    {summary.members_expiring_soon}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}