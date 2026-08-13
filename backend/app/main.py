from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints import (
    attendance,
    audit,
    auth,
    dashboard,
    gym,
    health,
    members,
    memberships,
    payments,
    plans,
    users,
)
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging
from app.core.middleware import RequestContextMiddleware
from app.core.redis import close_redis, init_redis

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.environment in ("development", "production"):
        await init_redis()
    yield
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
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(audit.router, prefix="/api/v1")
app.include_router(health.router, prefix="/api/v1")

register_exception_handlers(app)
