import logging

from fastapi import HTTPException, status
from fastapi.responses import JSONResponse

logger = logging.getLogger("gympro")


class AppException(HTTPException):
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        logger.warning("AppException: %s", detail, extra={"status_code": status_code})
        super().__init__(status_code=status_code, detail=detail)


class NotFoundException(AppException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(detail=detail, status_code=status.HTTP_404_NOT_FOUND)


class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Not authenticated"):
        super().__init__(detail=detail, status_code=status.HTTP_401_UNAUTHORIZED)


class ForbiddenException(AppException):
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(detail=detail, status_code=status.HTTP_403_FORBIDDEN)


class ConflictException(AppException):
    def __init__(self, detail: str):
        super().__init__(detail=detail, status_code=status.HTTP_409_CONFLICT)


class RateLimitException(AppException):
    def __init__(self, detail: str = "Too many requests"):
        super().__init__(detail=detail, status_code=status.HTTP_429_TOO_MANY_REQUESTS)


def register_exception_handlers(app):
    from fastapi import Request

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception: %s", str(exc))
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"},
        )

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )
