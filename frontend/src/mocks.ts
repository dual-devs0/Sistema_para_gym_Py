import type {
  Member,
  DashboardSummary,
  DashboardRevenueResponse,
  DashboardExpiringItem,
  TokenResponse,
  User,
} from "./types/api";

// Dev-only preview data. Loaded exclusively when VITE_MOCK_MODE is set
// (see src/services/api.ts) — never bundled into a production build.

export const MOCK_CREDENTIALS = {
  email: "admin@gympro.dev",
  password: "preview1234",
};

export const mockUser: User = {
  id: "mock-user-1",
  gym_id: "mock-gym-1",
  email: MOCK_CREDENTIALS.email,
  full_name: "Alex Rivera",
  role: "owner",
  phone: null,
  avatar_url: null,
  is_active: true,
  last_login: null,
  gym: {
    id: "mock-gym-1",
    name: "Gold's Gym Centro",
    slug: "golds-gym-downtown",
    logo_url: null,
    address: null,
    phone: null,
    email: null,
    currency: "USD",
    timezone: "UTC",
    business_hours: null,
  },
};

export const mockTokenResponse: TokenResponse = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  token_type: "bearer",
};

export const mockSummary: DashboardSummary = {
  revenue_today: 1240.0,
  revenue_month: 45890.0,
  active_members: 842,
  new_members_month: 23,
  checkins_today: 156,
  members_expiring_soon: 24,
};

export const mockRevenue: DashboardRevenueResponse = {
  labels: Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }),
  data: [840, 920, 1100, 1340, 1560, 1280, 1890, 2100, 2450, 2780, 3100, 3450, 3890, 4200, 4560, 4890, 5120, 5340, 5670, 5890, 6100, 6340, 6560, 6780, 7000, 7200, 7450, 7680, 7890, 8100],
};

// Matches the real /dashboard/expiring shape: backend only sends IDs, no
// member/plan names yet (see report to backend re: get_expiring() gap).
export const mockExpiring: DashboardExpiringItem[] = [
  { membership_id: "m1", member_id: "1", plan_id: "p1", end_date: "2026-08-01", status: "active" },
  { membership_id: "m2", member_id: "2", plan_id: "p2", end_date: "2026-08-02", status: "active" },
  { membership_id: "m3", member_id: "3", plan_id: "p1", end_date: "2026-08-02", status: "active" },
  { membership_id: "m4", member_id: "4", plan_id: "p3", end_date: "2026-08-03", status: "active" },
  { membership_id: "m5", member_id: "5", plan_id: "p2", end_date: "2026-08-03", status: "active" },
];

export const mockMembers: Member[] = [
  { id: "1", gym_id: "mock-gym-1", first_name: "Sara", last_name: "Jiménez", email: "sara@example.com", phone: null, document_number: null, birth_date: null, gender: null, photo_url: null, notes: null, status: "active", registered_at: "2026-01-10", updated_at: "2026-08-15" },
  { id: "2", gym_id: "mock-gym-1", first_name: "Tomás", last_name: "Herrera", email: "tomas@example.com", phone: null, document_number: null, birth_date: null, gender: null, photo_url: null, notes: null, status: "frozen", registered_at: "2025-11-02", updated_at: "2026-07-01" },
  { id: "3", gym_id: "mock-gym-1", first_name: "Julián", last_name: "Vanegas", email: "julian@example.com", phone: null, document_number: null, birth_date: null, gender: null, photo_url: null, notes: null, status: "cancelled", registered_at: "2025-06-15", updated_at: "2026-01-05" },
  { id: "4", gym_id: "mock-gym-1", first_name: "Marcos", last_name: "Aurelio", email: "marcos@example.com", phone: null, document_number: null, birth_date: null, gender: null, photo_url: null, notes: null, status: "active", registered_at: "2026-02-20", updated_at: "2026-09-01" },
];
