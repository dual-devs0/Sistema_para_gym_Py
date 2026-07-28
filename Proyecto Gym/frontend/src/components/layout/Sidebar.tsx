import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Dumbbell, CreditCard, CalendarCheck, Settings, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/members", label: "Miembros", icon: Users },
  { to: "/memberships", label: "Membresías", icon: Dumbbell },
  { to: "/payments", label: "Pagos", icon: CreditCard },
  { to: "/attendance", label: "Asistencias", icon: CalendarCheck },
  { to: "/settings", label: "Configuración", icon: Settings },
];

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-200">
        <Dumbbell className="h-6 w-6 text-primary-600" />
        <span className="text-xl font-bold text-gray-900">GymPro</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
