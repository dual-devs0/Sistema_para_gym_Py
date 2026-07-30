"""Seed a demo gym, owner user, and representative data for local/demo use.

Idempotent: safe to re-run. Uses the real AuthService password hashing
flow (bcrypt via app.core.security.hash_password), not a raw insert, so the
resulting credentials work against the real /auth/login endpoint.

Usage:
    cd backend
    .venv/Scripts/python.exe scripts/create_demo_user.py
"""

import asyncio
import sys
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.core.database import async_session_factory
from app.core.security import hash_password
from app.models.attendance import AttendanceLog
from app.models.gym import Gym
from app.models.member import Member
from app.models.membership import MemberMembership, MembershipPlan
from app.models.payment import Payment
from app.models.user import User

DEMO_EMAIL = "demo@gympro.dev"
DEMO_PASSWORD = "GymPro2026!"
DEMO_GYM_SLUG = "gympro-demo"


async def seed() -> None:
    async with async_session_factory() as db:
        gym = (await db.execute(select(Gym).where(Gym.slug == DEMO_GYM_SLUG))).scalar_one_or_none()
        if gym is None:
            gym = Gym(
                id=uuid.uuid4(),
                name="GymPro Demo",
                slug=DEMO_GYM_SLUG,
                currency="PYG",
                timezone="America/Asuncion",
                is_active=True,
            )
            db.add(gym)
            await db.flush()
            print(f"Created gym: {gym.name} ({gym.id})")
        else:
            print(f"Gym already exists: {gym.name} ({gym.id})")

        user = (await db.execute(select(User).where(User.email == DEMO_EMAIL))).scalar_one_or_none()
        if user is None:
            user = User(
                id=uuid.uuid4(),
                gym_id=gym.id,
                email=DEMO_EMAIL,
                password_hash=hash_password(DEMO_PASSWORD),
                full_name="Alex Rivera",
                role="owner",
                is_active=True,
                is_platform_staff=False,
            )
            db.add(user)
            await db.flush()
            print(f"Created user: {user.email}")
        else:
            print(f"User already exists: {user.email}")

        existing_plans = (await db.execute(select(MembershipPlan).where(MembershipPlan.gym_id == gym.id))).scalars().all()
        if existing_plans:
            plans = list(existing_plans)
            print(f"{len(plans)} plan(s) already exist, skipping plan seed")
        else:
            plans = [
                MembershipPlan(
                    id=uuid.uuid4(), gym_id=gym.id, name="Premium Anual",
                    price=850000, duration_days=365, type="anual", is_active=True,
                ),
                MembershipPlan(
                    id=uuid.uuid4(), gym_id=gym.id, name="Monthly Basic",
                    price=120000, duration_days=30, type="mensual", is_active=True,
                ),
            ]
            db.add_all(plans)
            await db.flush()
            print(f"Created {len(plans)} membership plans")

        existing_members = (await db.execute(select(Member).where(Member.gym_id == gym.id))).scalars().all()
        if existing_members:
            print(f"{len(existing_members)} member(s) already exist, skipping member/membership/payment/attendance seed")
            return

        today = date.today()
        members_data = [
            ("Sarah", "Jenkins", "active", plans[0]),
            ("Tom", "Harland", "frozen", plans[1]),
            ("Julian", "Vane", "cancelled", plans[1]),
            ("Marcus", "Aurelio", "active", plans[0]),
            ("Elena", "Cruz", "active", plans[1]),
        ]

        members = []
        for first, last, status, plan in members_data:
            m = Member(id=uuid.uuid4(), gym_id=gym.id, first_name=first, last_name=last, status=status)
            members.append((m, plan))
            db.add(m)
        await db.flush()
        print(f"Created {len(members)} members")

        memberships = []
        for idx, (m, plan) in enumerate(members):
            if m.status == "cancelled":
                start = today - timedelta(days=plan.duration_days + 30)
                end = today - timedelta(days=25)
            elif m.status == "frozen":
                start = today - timedelta(days=20)
                end = today + timedelta(days=plan.duration_days - 20)
            elif idx == 0:
                # first active member expires soon, to exercise the dashboard's "expiring" widget
                start = today - timedelta(days=5)
                end = today + timedelta(days=2)
            else:
                start = today - timedelta(days=5)
                end = today + timedelta(days=plan.duration_days - 5)
            mm = MemberMembership(
                id=uuid.uuid4(), member_id=m.id, plan_id=plan.id,
                start_date=start, end_date=end, price_paid=float(plan.price),
                status=m.status if m.status != "active" else "active",
            )
            memberships.append(mm)
            db.add(mm)
        await db.flush()
        print(f"Created {len(memberships)} memberships")

        payments = []
        for i, (m, plan) in enumerate(members):
            paid_at = datetime.now(timezone.utc) - timedelta(days=i)
            p = Payment(
                id=uuid.uuid4(), gym_id=gym.id, member_id=m.id,
                member_membership_id=memberships[i].id,
                amount=float(plan.price), payment_method="cash",
                status="paid", paid_at=paid_at,
            )
            payments.append(p)
            db.add(p)
        await db.flush()
        print(f"Created {len(payments)} payments")

        checkins = 0
        for m, _ in members:
            if m.status != "cancelled":
                log = AttendanceLog(
                    id=uuid.uuid4(), member_id=m.id,
                    check_in=datetime.now(timezone.utc) - timedelta(hours=checkins + 1),
                )
                db.add(log)
                checkins += 1
        await db.flush()
        print(f"Created {checkins} attendance logs")

        await db.commit()
        print("\nDemo data seeded.")
        print(f"  Login: {DEMO_EMAIL} / {DEMO_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(seed())
