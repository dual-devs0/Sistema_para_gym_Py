import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  const initials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "US";

  const handleLogout = () => {
    logout();
    navigate("/login");
    setUserMenuOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="w-full h-16 sticky top-0 z-40 bg-background border-b border-outline-variant flex justify-between items-center px-lg shrink-0">
        <div className="flex items-center gap-md flex-1">
          <span className="text-lg font-bold text-on-surface shrink-0">
            {user?.gym?.name || "Gimnasio"}
          </span>
        </div>

        <div className="flex items-center gap-lg">
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:opacity-80 p-2 rounded-lg hover:bg-surface-container-highest"
              aria-label="Notificaciones"
              aria-expanded={notificationsOpen}
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full border border-background" aria-hidden="true" />
            </button>
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-sm cursor-pointer hover:bg-surface-container-high px-sm py-1 rounded transition-colors group"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-[11px] font-semibold text-on-surface">{user?.full_name || "Usuario"}</span>
                <span className="text-[10px] text-on-surface-variant group-hover:text-primary">{user?.role || "Miembro"}</span>
              </div>
              <div className="w-8 h-8 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container text-xs font-bold border border-primary/20 overflow-hidden">
                <span className="font-bold text-xs">{initials}</span>
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface-container border border-outline-variant rounded-xl shadow-xl py-1 animate-fade-in">
                <div className="px-md py-sm border-b border-outline-variant">
                  <p className="text-sm font-medium text-on-surface">{user?.full_name}</p>
                  <p className="text-[11px] text-on-surface-variant">{user?.email}</p>
                </div>
                <Link
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors text-sm"
                >
                  <span className="material-symbols-outlined">settings</span>
                  <span>Configuración</span>
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors text-sm"
                >
                  <span className="material-symbols-outlined">person</span>
                  <span>Perfil</span>
                </Link>
                <hr className="my-1 border-outline-variant/30" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-sm px-md py-sm text-error hover:bg-error-container/20 hover:text-error transition-colors text-sm"
                >
                  <span className="material-symbols-outlined">logout</span>
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification Drawer */}
      <>
        <div
          className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${notificationsOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          onClick={() => setNotificationsOpen(false)}
        />
        <div
          className={`fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-surface-container border-l border-outline-variant shadow-2xl transition-transform duration-300 ease-out overflow-y-auto ${notificationsOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex items-center justify-between px-lg py-md border-b border-outline-variant">
            <h3 className="text-lg font-bold text-on-surface">Notificaciones</h3>
            <button
              onClick={() => setNotificationsOpen(false)}
              className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded hover:bg-surface-container-highest"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="px-lg py-xl text-center text-on-surface-variant text-sm">
            <span className="material-symbols-outlined text-4xl mb-md block opacity-40">notifications_off</span>
            Sin notificaciones
          </div>
        </div>
      </>
    </>
  );
}