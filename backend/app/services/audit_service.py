import json
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit_log import AuditLog


class AuditService:
    ACTIONS = {
        "LOGIN": "login",
        "LOGOUT": "logout",
        "CREATE": "create",
        "UPDATE": "update",
        "DELETE": "delete",
        "RESTORE": "restore",
        "ASSIGN": "assign",
        "CANCEL": "cancel",
        "RENEW": "renew",
        "PAYMENT": "payment",
        "REFUND": "refund",
        "ADJUST": "adjust",
        "PASSWORD_RESET": "password_reset",
        "ROLE_CHANGE": "role_change",
        "OPEN": "open",
        "CLOSE": "close",
        "WITHDRAW": "withdraw",
    }

    def __init__(
        self,
        db: AsyncSession,
        user_id: uuid.UUID | None = None,
        gym_id: uuid.UUID | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):  # noqa: E501
        self.db = db
        self.user_id = user_id
        self.gym_id = gym_id
        self.ip_address = ip_address
        self.user_agent = user_agent

    async def log(
        self, action: str, table_name: str, record_id: str | None = None, changes: dict[str, Any] | None = None
    ) -> None:  # noqa: E501
        if not self.gym_id:
            return
        log = AuditLog(
            gym_id=self.gym_id,
            user_id=self.user_id,
            action=action,
            table_name=table_name,
            record_id=record_id,
            changes=json.dumps(changes) if changes else None,
            ip_address=self.ip_address,
            user_agent=self.user_agent,
        )
        self.db.add(log)

    async def list_by_gym(self, gym_id: uuid.UUID, limit: int = 200) -> list[AuditLog]:
        result = await self.db.execute(
            select(AuditLog)
            .where(AuditLog.gym_id == gym_id)
            .options(selectinload(AuditLog.user))
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
