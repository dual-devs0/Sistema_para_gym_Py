import json
import uuid
from datetime import datetime, timezone
from typing import Any

from app.core.redis import get_redis


class TaskQueue:
    QUEUE_PREFIX = "task:queue:"
    RESULT_PREFIX = "task:result:"
    SCHEDULE_PREFIX = "task:schedule:"

    @staticmethod
    async def enqueue(queue_name: str, task_name: str, payload: dict[str, Any], delay_seconds: int = 0) -> str:
        redis = await get_redis()
        task_id = uuid.uuid4().hex[:16]
        task = {
            "id": task_id,
            "name": task_name,
            "payload": payload,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "attempts": 0,
        }
        if redis is None:
            return task_id
        key = f"{TaskQueue.QUEUE_PREFIX}{queue_name}"
        if delay_seconds > 0:
            await redis.zadd(f"{TaskQueue.SCHEDULE_PREFIX}{queue_name}", {json.dumps(task): datetime.now(timezone.utc).timestamp() + delay_seconds})
        else:
            await redis.rpush(key, json.dumps(task))
        return task_id

    @staticmethod
    async def dequeue(queue_name: str) -> dict[str, Any] | None:
        redis = await get_redis()
        if redis is None:
            return None
        key = f"{TaskQueue.QUEUE_PREFIX}{queue_name}"
        data = await redis.lpop(key)
        if data:
            return json.loads(data)
        return None

    @staticmethod
    async def get_queue_length(queue_name: str) -> int:
        redis = await get_redis()
        if redis is None:
            return 0
        return await redis.llen(f"{TaskQueue.QUEUE_PREFIX}{queue_name}")

    @staticmethod
    async def store_result(task_id: str, result: dict[str, Any]) -> None:
        redis = await get_redis()
        if redis is not None:
            await redis.setex(f"{TaskQueue.RESULT_PREFIX}{task_id}", 86400, json.dumps(result))

    @staticmethod
    async def get_pending_scheduled(queue_name: str) -> list[dict[str, Any]]:
        redis = await get_redis()
        if redis is None:
            return []
        now = datetime.now(timezone.utc).timestamp()
        items = await redis.zrangebyscore(f"{TaskQueue.SCHEDULE_PREFIX}{queue_name}", 0, now)
        if items:
            await redis.zremrangebyscore(f"{TaskQueue.SCHEDULE_PREFIX}{queue_name}", 0, now)
        return [json.loads(item) for item in items]
