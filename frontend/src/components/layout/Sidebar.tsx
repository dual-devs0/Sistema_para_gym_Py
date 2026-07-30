import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const navItems = [
  { to: "/", label: "Panel", icon: "dashboard" },
  { to: "/members", label: "Miembros", icon: "group" },
  { to: "/memberships", label: "Membresías", icon: "card_membership" },
  { to: "/attendance", label: "Asistencia", icon: "event_available" },
  { to: "/payments", label: "Pagos", icon: "payments" },
  { to: "/settings", label: "Configuración", icon: "settings" },
];

export default function Sidebar() {
  const { logout } = useAuth();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  return (
    <aside className="w-sidebar-width h-screen sticky top-0 left-0 bg-surface-container border-r border-outline-variant flex flex-col">
      <div className="px-md pt-lg pb-md flex flex-col items-center gap-xs shrink-0">
        <img
          alt="GymPro Logo"
          className="w-14 h-14 rounded-xl"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKHe_c79JUUldTRTYJoK3akLMwauF5gHrumPLBgi8SxMgfMQgLI2F04BNYoNTLLCEocKUpFINty3Km6mc386ieyGLd-vhje7FKuFgnnTa6CCHjjXw0s_CPS96JKhRJ_Tirk6rujxrzsANwlokIFi_LvZoxU2QQF1OEIx8WMU3ir1krVUov4E8qcOwdQ6q6SuEkZ3xmMMSnYk7LJCoOA5Wyliujj2QsNNYfUYSbIB0BHiY1pNbyz6ZZ"
        />
        <div className="flex flex-col items-center overflow-hidden">
          <span className="text-xl font-extrabold text-on-surface tracking-tight">GymPro</span>
          <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-semibold">Consola Admin</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-sm px-md py-sm rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "text-primary border-l-2 border-primary bg-surface-container-high"
                  : "text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface"
              }`
            }
            aria-label={label}
          >
            <span className="material-symbols-outlined shrink-0" style={{ fontSize: "24px" }}>
              {icon}
            </span>
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-outline-variant/30 pt-lg px-md space-y-1">
        <button
          onClick={handleLogout}
          className="flex items-center gap-sm w-full rounded-lg px-md py-sm text-sm font-medium transition-colors text-on-surface-variant hover:bg-surface-container-highest hover:text-red-400"
        >
          <span className="material-symbols-outlined shrink-0" style={{ fontSize: "24px" }}>
            logout
          </span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}