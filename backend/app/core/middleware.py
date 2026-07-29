import time

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging import correlation_id_var, request_id_var
from app.core.config import settings


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        rid = request.headers.get("X-Request-ID", "") or ""
        cid = request.headers.get("X-Correlation-ID", "") or ""
        request_id_var.set(rid)
        correlation_id_var.set(cid)

        start = time.time()
        response = await call_next(request)
        elapsed = time.time() - start
        response.headers["X-Response-Time-Ms"] = str(round(elapsed * 1000, 2))
        if rid:
            response.headers["X-Request-ID"] = rid

        return response
