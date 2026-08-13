import { useState, useRef, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { allowedNavPaths, canManageStaff, canViewGymSettings, roleLabel } from "../../utils/roles";

const allNavItems = [
  { to: "/", label: "Panel", icon: "dashboard" },
  { to: "/members", label: "Miembros", icon: "group" },
  { to: "/memberships", label: "Membresías", icon: "card_membership" },
  { to: "/attendance", label: "Asistencia", icon: "event_available" },
  { to: "/payments", label: "Pagos", icon: "payments" },
];

export default function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useOutsideClick(() => setMenuOpen(false));
  const mobileNavRef = useOutsideClick(() => setMobileNavOpen(false));

  const allowedPaths = allowedNavPaths(user?.role);
  const navItems = allNavItems.filter((i) => allowedPaths.includes(i.to));
  const showSettings = canViewGymSettings(user?.role);
  const showStaff = canManageStaff(user?.role);

  const initials =
    user?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "US";

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMenuOpen(false);
  };

  return (
    <header className="w-full sticky top-0 z-40 bg-surface-container-lowest/90 backdrop-blur border-b border-outline-variant/40">
      <div className="mx-auto w-full max-w-[1400px] px-lg flex items-center justify-between h-16 gap-md">
        {/* Logo + marca */}
        <div className="flex items-center gap-sm shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>
              fitness_center
            </span>
          </div>
          <div className="leading-tight hidden sm:block">
            <span className="text-base font-extrabold text-on-surface tracking-tight block">GymPro</span>
            <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-semibold block">Consola Admin</span>
          </div>
        </div>

        {/* Navegación horizontal */}
        <button
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
          onClick={() => setMobileNavOpen((o) => !o)}
          aria-expanded={mobileNavOpen}
          aria-label="Abrir menú de navegación"
        >
          <span className="material-symbols-outlined">{mobileNavOpen ? "close" : "menu"}</span>
        </button>
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2 px-md py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                }`
              }
            >
              <span className="material-symbols-outlined shrink-0" style={{ fontSize: "20px" }}>
                {icon}
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Acciones derecha */}
        <div className="flex items-center gap-lg">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className={`flex items-center gap-sm cursor-pointer px-sm py-1 rounded-full transition-colors group ${
                menuOpen ? "bg-surface-container-high" : "hover:bg-surface-container-high"
              }`}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              aria-label="Menú de usuario"
            >
              <div className="w-9 h-9 bg-primary-container rounded-full flex items-center justify-center text-xs font-bold text-on-primary-container border border-primary/20 overflow-hidden">
                <span className="font-bold text-xs">{initials}</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-lg group-hover:text-on-surface">
                expand_more
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-surface-container border border-outline-variant rounded-xl shadow-xl py-1 animate-fade-in">
                <div className="px-md py-sm border-b border-outline-variant">
                  <p className="text-sm font-medium text-on-surface">{user?.full_name}</p>
                  <p className="text-[11px] text-on-surface-variant truncate">{user?.email}</p>
                  <p className="text-[10px] text-primary font-semibold uppercase tracking-wide mt-0.5">{roleLabel(user?.role)}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors text-sm"
                >
                  <span className="material-symbols-outlined">person</span>
                  <span>Perfil</span>
                </Link>
                {showStaff && (
                  <Link
                    to="/staff"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors text-sm"
                  >
                    <span className="material-symbols-outlined">badge</span>
                    <span>Staff</span>
                  </Link>
                )}
                {showSettings && (
                  <Link
                    to="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors text-sm"
                  >
                    <span className="material-symbols-outlined">settings</span>
                    <span>Configuración</span>
                  </Link>
                )}
                <hr className="my-1 border-outline-variant/30" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-sm px-md py-sm text-error hover:bg-error/10 hover:text-error transition-colors text-sm"
                >
                  <span className="material-symbols-outlined">logout</span>
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileNavOpen && (
        <div ref={mobileNavRef} className="lg:hidden border-t border-outline-variant/40 bg-surface-container-lowest px-md py-sm animate-fade-in">
          <nav className="flex flex-col gap-1">
            {navItems.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-md py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                  }`
                }
              >
                <span className="material-symbols-outlined shrink-0" style={{ fontSize: "20px" }}>
                  {icon}
                </span>
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function useOutsideClick(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOutside]);
  return ref;
}