import logging

from redis.asyncio import Redis

from app.core.config import settings

logger = logging.getLogger("gympro")

_redis: Redis | None = None
_fake_redis: Redis | None = None


async def init_redis() -> Redis | None:
    global _redis, _fake_redis
    if _redis is not None:
        return _redis
    try:
        r = Redis.from_url(settings.redis_url, decode_responses=True, socket_connect_timeout=2)
        await r.ping()
        _redis = r
        logger.info("Connected to Redis at %s", settings.redis_url)
        return _redis
    except Exception as exc:
        logger.warning("Redis unavailable (%s), using fakeredis fallback", exc)
        try:
            from fakeredis.aioredis import FakeRedis
            _fake_redis = FakeRedis(decode_responses=True)
            return _fake_redis
        except ImportError:
            logger.warning("fakeredis not installed, Redis will be unavailable")
            return None


async def get_redis() -> Redis | None:
    global _redis, _fake_redis
    if _redis is not None:
        return _redis
    if _fake_redis is not None:
        return _fake_redis
    return await init_redis()


async def close_redis() -> None:
    global _redis, _fake_redis
    if _redis:
        await _redis.close()
        _redis = None
    if _fake_redis:
        await _fake_redis.close()
        _fake_redis = None
