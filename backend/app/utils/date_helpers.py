from datetime import UTC, date, datetime
from zoneinfo import ZoneInfo


def now_utc() -> datetime:
    return datetime.now(UTC)


def today_utc() -> date:
    return now_utc().date()


def now_local(tz_str: str) -> datetime:
    return datetime.now(ZoneInfo(tz_str))


def day_start_local(tz_str: str) -> datetime:
    now = now_local(tz_str)
    return datetime(now.year, now.month, now.day, tzinfo=ZoneInfo(tz_str))