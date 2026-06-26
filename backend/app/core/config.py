from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "LogForge"
    api_v1_prefix: str = ""
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60 * 24
    database_url: str = "postgresql+psycopg://logforge:logforge@postgres:5432/logforge"
    redis_url: str = "redis://redis:6379/0"
    clickhouse_host: str = "clickhouse"
    clickhouse_port: int = 8123
    clickhouse_user: str = "default"
    clickhouse_password: str = ""
    clickhouse_database: str = "logforge"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    bootstrap_admin_email: str = "admin@krynex.local"
    bootstrap_admin_password: str = "ChangeMe-LogForge-2026!"
    bootstrap_admin_org: str = "KRYNEX Labs"
    bootstrap_admin_name: str = "KRYNEX Admin"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
