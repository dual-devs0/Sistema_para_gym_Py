// Mirrors backend/app/core/permissions.py ROLE_PERMISSIONS — frontend-only
// convenience for hiding UI a role can't use. The backend is the actual
// security boundary; this just avoids showing dead ends (nav links that
// 403, buttons for actions the role can't perform).

export type Role = "owner" | "admin" | "trainer" | "receptionist" | "platform";

export const ROLE_LABELS: Record<string, string> = {
  owner: "Propietario",
  admin: "Administrador",
  trainer: "Entrenador",
  receptionist: "Recepción",
  platform: "Staff de plataforma",
};

// Which nav items each role can see. Matches backend permission gaps:
// receptionist/trainer lack dashboard.view and gym.settings.read.
const NAV_BY_ROLE: Record<string, string[]> = {
  owner: ["/", "/reception", "/members", "/memberships", "/attendance", "/payments"],
  admin: ["/", "/reception", "/members", "/memberships", "/attendance", "/payments"],
  receptionist: ["/reception", "/members", "/memberships", "/attendance", "/payments"],
  trainer: ["/reception", "/members", "/memberships", "/attendance"],
};

export function allowedNavPaths(role: string | undefined): string[] {
  return NAV_BY_ROLE[role || ""] || NAV_BY_ROLE.owner;
}

// Default landing route once logged in — dashboard for roles that can see
// it, otherwise the first thing they'd actually use day to day.
export function defaultRouteForRole(role: string | undefined): string {
  const allowed = allowedNavPaths(role);
  return allowed.includes("/") ? "/" : allowed[0] || "/attendance";
}

// gym.settings.read is owner/admin only.
export function canViewGymSettings(role: string | undefined): boolean {
  return role === "owner" || role === "admin";
}

// users.create/users.update are owner/admin only (trainer/receptionist only
// have users.read on the backend).
export function canManageStaff(role: string | undefined): boolean {
  return role === "owner" || role === "admin";
}

// plans.create/update/delete are owner/admin only — receptionist can assign
// existing plans (memberships.assign) but not create/edit/deactivate them.
export function canManagePlans(role: string | undefined): boolean {
  return role === "owner" || role === "admin";
}

// payments.refund is owner/admin only — receptionist can register payments
// but not refund them.
export function canRefundPayments(role: string | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function roleLabel(role: string | undefined): string {
  return ROLE_LABELS[role || ""] || role || "Usuario";
}
