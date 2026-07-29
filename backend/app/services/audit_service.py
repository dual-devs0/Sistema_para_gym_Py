import json
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

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
        "PASSWORD_RESET": "password_reset",
        "ROLE_CHANGE": "role_change",
    }

    def __init__(self, db: AsyncSession, user_id: uuid.UUID | None = None, gym_id: uuid.UUID | None = None, ip_address: str | None = None, user_agent: str | None = None):
        self.db = db
        self.user_id = user_id
        self.gym_id = gym_id
        self.ip_address = ip_address
        self.user_agent = user_agent

    async def log(self, action: str, table_name: str, record_id: str | None = None, changes: dict[str, Any] | None = None) -> None:
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
