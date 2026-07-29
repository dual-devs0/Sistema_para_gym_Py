import logging
import sys
import uuid
from contextvars import ContextVar

request_id_var: ContextVar[str] = ContextVar("request_id", default="")
correlation_id_var: ContextVar[str] = ContextVar("correlation_id", default="")


def get_request_id() -> str:
    return request_id_var.get()


def get_correlation_id() -> str:
    return correlation_id_var.get()


def generate_request_id() -> str:
    return uuid.uuid4().hex[:12]


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.Record) -> bool:
        record.request_id = get_request_id()
        record.correlation_id = get_correlation_id()
        return True


def setup_logging() -> None:
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(request_id)-12s | %(correlation_id)-12s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    handler.addFilter(RequestIdFilter())

    root = logging.getLogger("gympro")
    root.setLevel(logging.INFO)
    root.addHandler(handler)

    uvicorn_logger = logging.getLogger("uvicorn")
    uvicorn_logger.handlers.clear()
    uvicorn_logger.propagate = False
