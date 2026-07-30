import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface TopBarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function TopBar({ sidebarCollapsed, onToggleSidebar }: TopBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="w-full h-16 sticky top-0 z-40 bg-background border-b border-outline-variant flex justify-between items-center px-lg shrink-0">
      {/* Left: Toggle + Gym Name + Search */}
      <div className="flex items-center gap-md flex-1">
        {/* Mobile sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden text-on-surface-variant hover:text-primary transition-colors p-2 rounded-lg hover:bg-surface-container-highest"
          aria-label={sidebarCollapsed ? "Expandir menú" : "Contraer menú"}
        >
          <span className="material-symbols-outlined">
            {sidebarCollapsed ? "menu_open" : "menu"}
          </span>
        </button>

        <span className="font-headline-sm text-headline-sm font-bold text-on-surface shrink-0 hidden sm:block">
          {user?.gym?.name || "Gimnasio"}
        </span>

        {/* Search - Desktop */}
        <div className="hidden md:flex items-center bg-surface-container-low border border-outline-variant px-sm py-1 rounded-lg w-full max-w-md ml-lg">
          <span className="material-symbols-outlined text-on-surface-variant text-body-md">search</span>
          <input
            type="text"
            className="input-search ml-2 flex-1"
            placeholder="Buscar miembros, transacciones..."
          />
        </div>
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-lg">
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:opacity-80 p-2 rounded-lg hover:bg-surface-container-highest"
            aria-label="Notificaciones"
            aria-expanded={notificationsOpen}
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full border border-background" aria-hidden="true" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-surface-container border border-outline-variant rounded-xl shadow-xl py-2 animate-fade-in">
              <div className="px-md py-sm border-b border-outline-variant flex justify-between items-center">
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Notificaciones</h3>
                <button className="text-sm text-primary hover:underline">Marcar leídas</button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="px-md py-sm text-on-surface-variant text-sm">Sin notificaciones</div>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-sm cursor-pointer hover:bg-surface-container-high px-sm py-1 rounded transition-colors group"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="font-label-caps text-label-caps text-on-surface">{user?.full_name || "Usuario"}</span>
              <span className="text-[10px] text-on-surface-variant group-hover:text-primary">{user?.role || "Miembro"}</span>
            </div>
            <div className="w-8 h-8 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container text-xs font-bold border border-primary/20 overflow-hidden">
              <span className="font-bold text-xs">{initials}</span>
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-surface-container border border-outline-variant rounded-xl shadow-xl py-1 animate-fade-in">
              <div className="px-md py-sm border-b border-outline-variant">
                <p className="font-body-md text-body-md text-on-surface">{user?.full_name}</p>
                <p className="text-[11px] text-on-surface-variant">{user?.email}</p>
              </div>
              <Link
                to="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors font-body-md text-body-md"
              >
                <span className="material-symbols-outlined">settings</span>
                <span>Configuración</span>
              </Link>
              <Link
                to="/profile"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors font-body-md text-body-md"
              >
                <span className="material-symbols-outlined">person</span>
                <span>Perfil</span>
              </Link>
              <hr className="my-1 border-outline-variant/30" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-sm px-md py-sm text-error hover:bg-error-container/20 hover:text-error transition-colors font-body-md text-body-md"
              >
                <span className="material-symbols-outlined">logout</span>
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}