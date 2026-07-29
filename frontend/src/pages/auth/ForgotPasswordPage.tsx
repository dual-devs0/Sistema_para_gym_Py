import { Link } from "react-router-dom";

export default function ForgotPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary opacity-5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[28rem] mx-auto px-4">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: "32px" }}>lock_reset</span>
          </div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">Recuperar acceso</h1>
        </div>

        <div className="animate-slide-in-up rounded-2xl bg-surface-container border border-outline-variant px-lg py-xl shadow-2xl">
          <p className="text-sm text-on-surface-variant text-center">
            Tu cuenta fue creada por el equipo de GymPro. Contactá a soporte para recuperar tu acceso.
          </p>

          <Link
            to="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm text-primary hover:underline font-medium"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_back</span>
            Volver a inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
