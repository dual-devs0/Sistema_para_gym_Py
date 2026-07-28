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
  registered_at: string;
  updated_at: string;
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
}

export interface DashboardSummary {
  revenue_today: number;
  revenue_month: number;
  active_members: number;
  new_members_month: number;
  checkins_today: number;
  members_expiring_soon: number;
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
}
