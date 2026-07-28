from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://gympro:gympro_dev@localhost:5432/gympro"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = "change-this-to-a-random-secret-key"
    environment: str = "development"
    sentry_dsn: str | None = None
    cors_origins: str = "http://localhost:5173"

    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    model_config = {"env_file": ".env", "case_sensitive": False}


settings = Settings()
