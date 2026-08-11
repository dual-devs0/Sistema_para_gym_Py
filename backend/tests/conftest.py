import os
import uuid
from collections.abc import AsyncGenerator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import get_db
from app.main import app
from app.models.base import Base
from app.models.gym import Gym
from app.models.member import Member

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://gympro:gympro_dev@localhost:5432/gympro_test",
    ),
)


@pytest_asyncio.fixture
async def engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(engine) -> AsyncGenerator[AsyncSession, None]:
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def gym(db_session: AsyncSession) -> Gym:
    g = Gym(name="Test Gym", slug=f"test-gym-{uuid.uuid4().hex[:8]}")
    db_session.add(g)
    await db_session.commit()
    await db_session.refresh(g)
    return g


@pytest_asyncio.fixture
async def gym_id(gym: Gym) -> uuid.UUID:
    return gym.id


@pytest_asyncio.fixture
async def other_gym_id(db_session: AsyncSession) -> uuid.UUID:
    g = Gym(name="Other Gym", slug=f"other-gym-{uuid.uuid4().hex[:8]}")
    db_session.add(g)
    await db_session.commit()
    await db_session.refresh(g)
    return g.id


@pytest_asyncio.fixture
async def member(db_session: AsyncSession, gym: Gym) -> Member:
    m = Member(gym_id=gym.id, first_name="Test", last_name="Member")
    db_session.add(m)
    await db_session.commit()
    await db_session.refresh(m)
    return m


@pytest_asyncio.fixture
async def member_id(member: Member) -> uuid.UUID:
    return member.id


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
