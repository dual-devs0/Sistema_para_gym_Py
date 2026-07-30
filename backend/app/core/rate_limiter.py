import time
from collections.abc import Callable
from functools import wraps

from fastapi import Request

from app.core.config import settings
from app.core.exceptions import RateLimitException


class RateLimiter:
    def __init__(self, redis):
        self.redis = redis

    async def check(self, key: str, max_requests: int, window_seconds: int = 60) -> None:
        if self.redis is None:
            return
        now = int(time.time())
        window_key = f"ratelimit:{key}:{now // window_seconds}"
        count = await self.redis.incr(window_key)
        if count == 1:
            await self.redis.expire(window_key, window_seconds + 1)
        if count > max_requests:
            raise RateLimitException()

    async def check_login(self, identifier: str) -> None:
        await self.check(f"login:{identifier}", settings.rate_limit_login_per_minute)

    async def check_global(self, identifier: str) -> None:
        await self.check(f"global:{identifier}", settings.rate_limit_global_per_minute)


def rate_limit(max_requests: int, window_seconds: int = 60):
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request = kwargs.get("request")
            if request is None:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
            if request:
                key = f"{func.__name__}:{request.client.host if request.client else 'unknown'}"
                from app.core.redis import get_redis

                redis = await get_redis()
                limiter = RateLimiter(redis)
                await limiter.check(key, max_requests, window_seconds)
            return await func(*args, **kwargs)

        return wrapper

    return decorator
