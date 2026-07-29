import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const navItems = [
  { to: "/", label: "Panel", icon: "dashboard" },
  { to: "/members", label: "Miembros", icon: "group" },
  { to: "/memberships", label: "Membresías", icon: "card_membership" },
  { to: "/attendance", label: "Asistencia", icon: "event_available" },
  { to: "/payments", label: "Pagos", icon: "payments" },
  { to: "/settings", label: "Config.", icon: "settings" },
];

const bottomItems = [
  { to: "/support", label: "Soporte", icon: "help" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: (collapsed: boolean) => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { logout } = useAuth();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  return (
    <aside
      className={`w-sidebar-width h-screen sticky top-0 left-0 bg-surface-container border-r border-outline-variant flex flex-col transition-all duration-200 ${collapsed ? "w-[64px]" : ""}`}
    >
      <div className="px-md mb-xl flex items-center gap-sm shrink-0">
        <img
          alt="GymPro Logo"
          className="w-8 h-8 rounded"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKHe_c79JUUldTRTYJoK3akLMwauF5gHrumPLBgi8SxMgfMQgLI2F04BNYoNTLLCEocKUpFINty3Km6mc386ieyGLd-vhje7FKuFgnnTa6CCHjjXw0s_CPS96JKhRJ_Tirk6rujxrzsANwlokIFi_LvZoxU2QQF1OEIx8WMU3ir1krVUov4E8qcOwdQ6q6SuEkZ3xmMMSnYk7LJCoOA5Wyliujj2QsNNYfUYSbIB0BHiY1pNbyz6ZZ"
        />
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">GymPro</span>
            <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Consola Admin</span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
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
            style={{ width: collapsed ? "100%" : "auto" }}
            aria-label={label}
          >
            <span className="material-symbols-outlined shrink-0" style={{ fontSize: "24px" }}>
              {icon}
            </span>
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className={`mt-auto border-t border-outline-variant/30 pt-lg space-y-1 ${collapsed ? "px-3" : "px-md"}`}>
        {bottomItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={`flex items-center gap-sm px-md py-sm rounded-lg transition-colors font-body-md text-body-md ${
              collapsed ? "justify-center" : ""
            } text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface`}
          >
            <span className="material-symbols-outlined shrink-0" style={{ fontSize: "24px" }}>
              {icon}
            </span>
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-sm w-full rounded-lg px-md py-sm text-sm font-medium transition-colors ${
            collapsed ? "justify-center" : ""
          } text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface`}
        >
          <span className="material-symbols-outlined shrink-0" style={{ fontSize: "24px" }}>
            logout
          </span>
          {!collapsed && <span>Cerrar sesión</span>}
        </button>

        {/* Collapse toggle button (mobile only) */}
        <button
          onClick={() => onToggle(!collapsed)}
          className="md:hidden flex items-center justify-center gap-sm w-full rounded-lg px-md py-sm text-sm font-medium text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors"
          aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
            {collapsed ? "chevron_right" : "chevron_left"}
          </span>
          {!collapsed && <span>Contraer</span>}
        </button>
      </div>
    </aside>
  );
}