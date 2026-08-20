import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import gymHero from "../../assets/gym-hero.jpg";

const FEATURES = [
  { icon: "group", label: "Miembros y membresías", detail: "Altas, renovaciones y estados al día" },
  { icon: "payments", label: "Pagos y facturación", detail: "Cobros, reembolsos y reportes de ingresos" },
  { icon: "qr_code_scanner", label: "Control de asistencia", detail: "Check-in en recepción, historial por miembro" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

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
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Panel - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={transitioning ? { x: "-100%", opacity: 0 } : { x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
          className="flex flex-col items-center justify-center px-4 py-12 relative z-10 bg-background"
        >
          <div className="w-full max-w-[26rem]">
            <div className="flex flex-col items-center mb-9">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 border border-primary/25">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>
                    bolt
                  </span>
                </span>
                <span className="text-2xl font-extrabold text-on-surface tracking-tight">GymPro</span>
              </div>
              <p className="text-[11px] font-data-mono uppercase tracking-[0.2em] text-primary/80 mb-2">
                Consola de administración
              </p>
              <p className="text-sm text-on-surface-variant text-center leading-relaxed">
                Accedé con tus credenciales para gestionar tu gimnasio.
              </p>
            </div>

            <div className="relative rounded-2xl bg-surface-container border border-outline-variant px-8 py-8 shadow-xl overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
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

            <div className="text-center mt-8">
              <p className="text-xs text-on-surface-variant">GymPro Admin Console — v2.4.0</p>
            </div>
          </div>
        </motion.div>

        {/* Right Panel - Hero */}
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
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />

          <div className="relative z-10 h-full flex flex-col justify-between px-12 py-16">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                Operando en tiempo real
              </p>
            </div>

            <div className="max-w-[26rem]">
              <h2 className="text-4xl font-bold text-on-surface leading-[1.15] tracking-tight mb-3">
                Todo tu gimnasio, en un solo lugar.
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-8">
                Miembros, pagos, planes y asistencia — una sola consola para tu equipo de recepción y administración.
              </p>

              <div className="space-y-3">
                {FEATURES.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center gap-3 rounded-xl bg-surface-container/80 backdrop-blur border border-outline-variant/50 px-4 py-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: "18px" }}>
                        {f.icon}
                      </span>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-on-surface leading-tight">{f.label}</p>
                      <p className="text-xs text-on-surface-variant leading-tight mt-0.5">{f.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
