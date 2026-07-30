from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    environment: str = Field(default="development", alias="ENVIRONMENT")

    database_url: str = Field(alias="DATABASE_URL")
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    secret_key: str = Field(min_length=32, alias="SECRET_KEY")
    sentry_dsn: str | None = Field(default=None, alias="SENTRY_DSN")
    cors_origins: str = Field(default="http://localhost:5173", alias="CORS_ORIGINS")

    access_token_expire_minutes: int = Field(default=15, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, alias="REFRESH_TOKEN_EXPIRE_DAYS")
    password_reset_token_expire_minutes: int = Field(default=15, alias="PASSWORD_RESET_TOKEN_EXPIRE_MINUTES")

    bcrypt_rounds: int = Field(default=12, alias="BCRYPT_ROUNDS")
    max_request_body_size: int = Field(default=10_000_000, alias="MAX_REQUEST_BODY_SIZE")

    rate_limit_login_per_minute: int = Field(default=5, alias="RATE_LIMIT_LOGIN_PER_MINUTE")
    rate_limit_global_per_minute: int = Field(default=60, alias="RATE_LIMIT_GLOBAL_PER_MINUTE")

    db_pool_size: int = Field(default=20, alias="DB_POOL_SIZE")
    db_max_overflow: int = Field(default=10, alias="DB_MAX_OVERFLOW")
    db_pool_timeout: int = Field(default=30, alias="DB_POOL_TIMEOUT")
    db_echo: bool = Field(default=False, alias="DB_ECHO")

    cors_allow_methods: str = Field(default="GET,POST,PUT,DELETE,OPTIONS,PATCH", alias="CORS_ALLOW_METHODS")
    cors_allow_headers: str = Field(
        default="Authorization,Content-Type,X-Requested-With,Accept,Origin", alias="CORS_ALLOW_HEADERS"
    )  # noqa: E501

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def cors_method_list(self) -> list[str]:
        return [o.strip() for o in self.cors_allow_methods.split(",")]

    @property
    def cors_header_list(self) -> list[str]:
        return [o.strip() for o in self.cors_allow_headers.split(",")]

    @property
    def is_development(self) -> bool:
        return self.environment == "development"

    @property
    def is_testing(self) -> bool:
        return self.environment == "testing"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if v == "change-this-to-a-random-secret-key" or v == "dev-secret-key-change-in-production":
            raise ValueError(
                "SECRET_KEY must be changed from the default value. "
                "Generate a strong random key with: openssl rand -hex 32"
            )
        return v

    @field_validator("environment")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        allowed = {"development", "testing", "production"}
        if v.lower() not in allowed:
            raise ValueError(f"ENVIRONMENT must be one of: {', '.join(sorted(allowed))}")
        return v.lower()

    model_config = {"env_file": ".env", "case_sensitive": False, "extra": "ignore"}


settings = Settings()
