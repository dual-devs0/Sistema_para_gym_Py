import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints import (
    attendance,
    audit,
    auth,
    dashboard,
    gym,
    health,
    invoicing,
    members,
    memberships,
    notifications,
    payments,
    plans,
    users,
)
from app.core.config import settings
from app.core.database import async_session_factory
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging
from app.core.middleware import RequestContextMiddleware
from app.core.redis import close_redis, init_redis
from app.repositories.gym_repository import GymRepository
from app.services.invoicing_service import InvoicingService
from app.services.notification_service import NotificationService

setup_logging()
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def send_daily_expiry_reminders() -> None:
    # Only gyms that opted in via Settings > Notificaciones get reminders;
    # with WHATSAPP_360DIALOG_API_KEY unset every send just logs "disabled".
    async with async_session_factory() as session:
        gym_repo = GymRepository(session)
        service = NotificationService(session)
        gyms = await gym_repo.list_active_with_notifications_enabled()
        for gym_row in gyms:
            try:
                await service.send_expiry_reminders(gym_row.id)
                await session.commit()
            except Exception:
                logger.exception("Expiry reminder cron failed for gym %s", gym_row.id)
                await session.rollback()


async def retry_pending_sifen_documents() -> None:
    # Sub-entrega 3a: every gym is still fiscally "not ready" (no certificate
    # handling yet), so this just re-affirms pending_stamping rows without
    # side effects — proves the retry loop is wired correctly ahead of 3b,
    # where it'll actually attempt real transmission.
    async with async_session_factory() as session:
        gym_repo = GymRepository(session)
        service = InvoicingService(session)
        gyms = await gym_repo.list_active()
        for gym_row in gyms:
            try:
                await service.retry_pending(gym_row.id)
                await session.commit()
            except Exception:
                logger.exception("SIFEN retry cron failed for gym %s", gym_row.id)
                await session.rollback()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.environment in ("development", "production"):
        await init_redis()
    scheduler.add_job(send_daily_expiry_reminders, "cron", hour=9, id="expiry_reminders", replace_existing=True)
    scheduler.add_job(
        retry_pending_sifen_documents, "interval", minutes=15, id="sifen_retry", replace_existing=True
    )
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)
    await close_redis()


app = FastAPI(title="GymPro API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=settings.cors_method_list,
    allow_headers=settings.cors_header_list,
)

app.add_middleware(RequestContextMiddleware)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(members.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(gym.router, prefix="/api/v1")
app.include_router(plans.router, prefix="/api/v1")
app.include_router(memberships.router, prefix="/api/v1")
app.include_router(attendance.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(invoicing.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(audit.router, prefix="/api/v1")
app.include_router(health.router, prefix="/api/v1")

register_exception_handlers(app)
