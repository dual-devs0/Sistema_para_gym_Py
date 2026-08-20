export interface Member {
  id: string;
  gym_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  document_number: string | null;
  birth_date: string | null;
  gender: string | null;
  photo_url: string | null;
  notes: string | null;
  status: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface MemberBalanceMovement {
  id: string;
  member_id: string;
  amount: number;
  motivo: string;
  created_by_user_id: string | null;
  created_at: string;
}

export interface MemberListItem {
  id: string;
  avatar?: string;
  name: string;
  memberId: string;
  plan: string;
  status: "active" | "frozen" | "cancelled";
  expiration: string;
  lastCheckin: string;
}

export interface MembershipPlan {
  id: string;
  gym_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  max_visits: number | null;
  type: string;
  is_active: boolean;
}

export interface MemberMembership {
  id: string;
  member_id: string;
  plan_id: string;
  plan_name: string | null;
  start_date: string;
  end_date: string;
  remaining_visits: number | null;
  price_paid: number;
  status: string;
  auto_renew: boolean;
}

export interface AttendanceLog {
  id: string;
  member_id: string;
  member_name: string | null;
  check_in: string;
  check_out: string | null;
}

export interface Payment {
  id: string;
  gym_id: string;
  member_id: string;
  member_name: string | null;
  amount: number;
  payment_method: string;
  reference: string | null;
  status: string;
  paid_at: string | null;
  notes: string | null;
  sifen_status: "pending_stamping" | "signed" | "transmitted" | "approved" | "rejected" | "error" | null;
}

export interface GymFiscalConfig {
  id: string;
  gym_id: string;
  ruc: string | null;
  razon_social: string | null;
  sifen_environment: string;
}

export interface Timbrado {
  id: string;
  gym_id: string;
  establecimiento: string;
  punto_expedicion: string;
  numero_desde: number;
  numero_hasta: number;
  numero_actual: number;
  fecha_vencimiento: string;
  is_active: boolean;
}

export interface DashboardSummary {
  revenue_today: number;
  revenue_month: number;
  active_members: number;
  frozen_members: number;
  cancelled_members: number;
  new_members_month: number;
  checkins_today: number;
  members_expiring_soon: number;
}

export interface DashboardRevenueResponse {
  labels: string[];
  data: number[];
}

export interface DashboardMemberStatusBreakdown {
  active: number;
  frozen: number;
  cancelled: number;
}

export interface UserInfo {
  id: string;
  email: string;
  full_name: string;
  role: string;
  gym_id: string | null;
  gym: { name: string } | null;
  last_login: string | null;
}

export interface DashboardRevenueResponse {
  labels: string[];
  data: number[];
}

export interface DashboardExpiringItem {
  membership_id: string;
  member_id: string;
  member_name: string;
  plan_id: string;
  plan_name: string;
  end_date: string;
  status: string;
}

export interface DashboardExpiringResponse {
  items: DashboardExpiringItem[];
}

export interface AttendanceTodayResponse {
  total_checkins: number;
  active_now: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface GymSettings {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  timezone: string;
  business_hours: Record<string, string> | null;
  notifications_enabled: boolean;
  debt_limit: number | null;
}

export interface NotificationLog {
  id: string;
  member_id: string;
  member_membership_id: string | null;
  type: "payment_confirmation" | "expiry_reminder";
  status: "sent" | "failed" | "disabled";
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface User {
  id: string;
  gym_id: string;
  email: string;
  full_name: string;
  role: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login: string | null;
  gym?: GymSettings;
}