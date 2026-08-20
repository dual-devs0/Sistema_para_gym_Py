from app.core.exceptions import ForbiddenException


class Perm:
    MEMBER_READ = "members.read"
    MEMBER_CREATE = "members.create"
    MEMBER_UPDATE = "members.update"
    MEMBER_DELETE = "members.delete"

    PAYMENT_READ = "payments.read"
    PAYMENT_CREATE = "payments.create"
    PAYMENT_REFUND = "payments.refund"

    PLAN_READ = "plans.read"
    PLAN_CREATE = "plans.create"
    PLAN_UPDATE = "plans.update"
    PLAN_DELETE = "plans.delete"

    MEMBERSHIP_READ = "memberships.read"
    MEMBERSHIP_ASSIGN = "memberships.assign"
    MEMBERSHIP_CANCEL = "memberships.cancel"
    MEMBERSHIP_RENEW = "memberships.renew"

    ATTENDANCE_READ = "attendance.read"
    ATTENDANCE_CHECKIN = "attendance.checkin"
    ATTENDANCE_CHECKOUT = "attendance.checkout"

    USER_READ = "users.read"
    USER_CREATE = "users.create"
    USER_UPDATE = "users.update"
    USER_DELETE = "users.delete"

    GYM_SETTINGS_READ = "gym.settings.read"
    GYM_SETTINGS_UPDATE = "gym.settings.update"

    INVOICING_READ = "invoicing.read"
    INVOICING_MANAGE = "invoicing.manage"

    MEMBER_BALANCE_READ = "members.balance.read"
    MEMBER_BALANCE_ADJUST = "members.balance.adjust"

    DASHBOARD_VIEW = "dashboard.view"

    AUDIT_VIEW = "audit.view"

    PLATFORM_MANAGE_GYMS = "platform.manage_gyms"


ROLE_PERMISSIONS: dict[str, set[str]] = {
    "platform": {
        Perm.PLATFORM_MANAGE_GYMS,
        Perm.USER_READ,
        Perm.USER_CREATE,
        Perm.USER_UPDATE,
        Perm.USER_DELETE,
    },
    "owner": {
        Perm.MEMBER_READ,
        Perm.MEMBER_CREATE,
        Perm.MEMBER_UPDATE,
        Perm.MEMBER_DELETE,
        Perm.PAYMENT_READ,
        Perm.PAYMENT_CREATE,
        Perm.PAYMENT_REFUND,
        Perm.PLAN_READ,
        Perm.PLAN_CREATE,
        Perm.PLAN_UPDATE,
        Perm.PLAN_DELETE,
        Perm.MEMBERSHIP_READ,
        Perm.MEMBERSHIP_ASSIGN,
        Perm.MEMBERSHIP_CANCEL,
        Perm.MEMBERSHIP_RENEW,
        Perm.ATTENDANCE_READ,
        Perm.ATTENDANCE_CHECKIN,
        Perm.ATTENDANCE_CHECKOUT,
        Perm.USER_READ,
        Perm.USER_CREATE,
        Perm.USER_UPDATE,
        Perm.USER_DELETE,
        Perm.GYM_SETTINGS_READ,
        Perm.GYM_SETTINGS_UPDATE,
        Perm.INVOICING_READ,
        Perm.INVOICING_MANAGE,
        Perm.MEMBER_BALANCE_READ,
        Perm.MEMBER_BALANCE_ADJUST,
        Perm.DASHBOARD_VIEW,
        Perm.AUDIT_VIEW,
    },
    "admin": {
        Perm.MEMBER_READ,
        Perm.MEMBER_CREATE,
        Perm.MEMBER_UPDATE,
        Perm.MEMBER_DELETE,
        Perm.PAYMENT_READ,
        Perm.PAYMENT_CREATE,
        Perm.PAYMENT_REFUND,
        Perm.PLAN_READ,
        Perm.PLAN_CREATE,
        Perm.PLAN_UPDATE,
        Perm.PLAN_DELETE,
        Perm.MEMBERSHIP_READ,
        Perm.MEMBERSHIP_ASSIGN,
        Perm.MEMBERSHIP_CANCEL,
        Perm.MEMBERSHIP_RENEW,
        Perm.ATTENDANCE_READ,
        Perm.ATTENDANCE_CHECKIN,
        Perm.ATTENDANCE_CHECKOUT,
        Perm.USER_READ,
        Perm.USER_CREATE,
        Perm.USER_UPDATE,
        Perm.GYM_SETTINGS_READ,
        Perm.GYM_SETTINGS_UPDATE,
        Perm.INVOICING_READ,
        Perm.INVOICING_MANAGE,
        Perm.MEMBER_BALANCE_READ,
        Perm.MEMBER_BALANCE_ADJUST,
        Perm.DASHBOARD_VIEW,
    },
    "trainer": {
        Perm.MEMBER_READ,
        Perm.MEMBER_CREATE,
        Perm.MEMBER_UPDATE,
        Perm.PLAN_READ,
        Perm.MEMBERSHIP_READ,
        Perm.ATTENDANCE_READ,
        Perm.ATTENDANCE_CHECKIN,
        Perm.ATTENDANCE_CHECKOUT,
        Perm.USER_READ,
        Perm.MEMBER_BALANCE_READ,
    },
    "receptionist": {
        Perm.MEMBER_READ,
        Perm.MEMBER_CREATE,
        Perm.MEMBER_UPDATE,
        Perm.PAYMENT_READ,
        Perm.PAYMENT_CREATE,
        Perm.PLAN_READ,
        Perm.MEMBERSHIP_READ,
        Perm.MEMBERSHIP_ASSIGN,
        Perm.MEMBERSHIP_RENEW,
        Perm.ATTENDANCE_READ,
        Perm.ATTENDANCE_CHECKIN,
        Perm.ATTENDANCE_CHECKOUT,
        Perm.USER_READ,
        Perm.MEMBER_BALANCE_READ,
    },
}


def require_permission(*permissions: str):
    def permission_checker(current_user):
        user_perms = ROLE_PERMISSIONS.get(current_user.role, set())
        for perm in permissions:
            if perm not in user_perms:
                raise ForbiddenException(f"Missing permission: {perm}")
        return current_user

    return permission_checker
