import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import api from "../../services/api";

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
      setTimeout(() => navigate("/"), 650);
    } catch {
      setError("Credenciales inválidas. Verifica tu usuario y contraseña.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="grid min-h-screen lg:grid-cols-2">
        <motion.div
          animate={transitioning ? { x: "-100%" } : { x: 0 }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          className="flex flex-col items-center justify-center px-4 py-12 relative z-10 bg-background"
        >
          <div className="w-full max-w-[26rem]">
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: "32px" }}>
                  fitness_center
                </span>
              </div>
              <h1 className="text-3xl font-bold text-on-surface tracking-tight">GymPro</h1>
              <p className="mt-2 text-sm text-on-surface-variant text-center">
                Ingresá con las credenciales que te compartió el equipo de GymPro.
              </p>
            </div>

            <div className="animate-slide-in-up rounded-2xl bg-surface-container border border-outline-variant px-lg py-xl shadow-2xl">
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

                <Button type="submit" loading={loading} fullWidth className="mt-2">
                  Iniciar sesión
                </Button>
              </form>
            </div>

            <div className="text-center mt-6 space-y-1">
              <p className="text-xs text-on-surface-variant">GymPro Admin Console &mdash; v2.4.0</p>
              {lastLoginText && (
                <p className="text-[11px] text-on-surface-variant/70">
                  Último ingreso: {lastLoginText}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        <div className="hidden lg:block relative overflow-hidden bg-surface-container-low">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 20%, rgba(192,193,255,0.15), transparent 50%), radial-gradient(circle at 80% 80%, rgba(78,222,163,0.1), transparent 50%)",
            }}
          />
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.07]"
            viewBox="0 0 400 400"
            preserveAspectRatio="xMidYMid slice"
          >
            <circle cx="200" cy="120" r="70" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
            <rect x="80" y="220" width="240" height="14" rx="7" fill="currentColor" className="text-primary" />
            <rect x="60" y="210" width="30" height="34" rx="6" fill="currentColor" className="text-primary" />
            <rect x="310" y="210" width="30" height="34" rx="6" fill="currentColor" className="text-primary" />
          </svg>

          <div className="relative z-10 h-full flex flex-col justify-center px-12">
            <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">
              Panel en vivo
            </p>
            <h2 className="text-2xl font-semibold text-on-surface mb-8 max-w-lg">
              Todo tu gimnasio, en un solo lugar.
            </h2>

            {summary && (
              <div
                className="grid grid-cols-2 gap-4 max-w-md"
              >
                  <div className="rounded-xl bg-surface-container/80 backdrop-blur border border-outline-variant px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Ingresos hoy</p>
                    <p className="text-xl font-bold text-on-surface font-data-mono mt-1">
                      {formatCurrency(summary.revenue_today)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-container/80 backdrop-blur border border-outline-variant px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Miembros activos</p>
                    <p className="text-xl font-bold text-on-surface font-data-mono mt-1">
                      {summary.active_members}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-container/80 backdrop-blur border border-outline-variant px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Check-ins hoy</p>
                    <p className="text-xl font-bold text-on-surface font-data-mono mt-1">
                      {summary.checkins_today}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-container/80 backdrop-blur border border-outline-variant px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Por vencer</p>
                    <p className="text-xl font-bold text-tertiary font-data-mono mt-1">
                      {summary.members_expiring_soon}
                    </p>
                  </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
