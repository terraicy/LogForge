import json
import os
import subprocess
import uuid
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any

import clickhouse_connect

from app.core.config import settings
from app.schemas import LogIngestItem, LogSearchRequest

CPP_LOG_NORMALIZER_ENV = "LOGFORGE_CPP_LOG_NORMALIZER"
CPP_FORCE_ENV = "LOGFORGE_FORCE_CPP"
CPP_MESSAGE_THRESHOLD_BYTES = 4096


def _cpp_log_normalizer_path() -> Path:
    suffix = ".exe" if os.name == "nt" else ""
    return Path(__file__).resolve().parents[2] / "cpp" / "log_normalizer" / f"logforge-log-normalizer{suffix}"


def _normalize_level_cpp(level: str | None, message: str) -> str | None:
    if os.getenv(CPP_FORCE_ENV) != "1" and len(message.encode("utf-8")) < CPP_MESSAGE_THRESHOLD_BYTES:
        return None
    configured = os.getenv(CPP_LOG_NORMALIZER_ENV)
    binary = Path(configured) if configured else _cpp_log_normalizer_path()
    if not binary.exists():
        return None
    try:
        completed = subprocess.run(
            [str(binary), level or "-"],
            capture_output=True,
            check=True,
            input=message,
            text=True,
            timeout=5,
        )
        return completed.stdout.strip()
    except Exception:
        return None


@lru_cache(maxsize=1)
def client():
    return clickhouse_connect.get_client(
        host=settings.clickhouse_host,
        port=settings.clickhouse_port,
        username=settings.clickhouse_user,
        password=settings.clickhouse_password,
        database=settings.clickhouse_database,
    )


def ensure_events_table() -> None:
    client().command(
        """
        CREATE TABLE IF NOT EXISTS events
        (
            event_id UUID,
            organization_id UUID,
            source_id Nullable(UUID),
            timestamp DateTime64(3, 'UTC'),
            level LowCardinality(String),
            service LowCardinality(String),
            host LowCardinality(String),
            message String,
            fields_json String,
            indexed_at DateTime64(3, 'UTC')
        )
        ENGINE = MergeTree
        PARTITION BY toYYYYMM(timestamp)
        ORDER BY (organization_id, timestamp, level, service, host)
        """
    )


def ingest_events(organization_id: uuid.UUID, events: list[LogIngestItem]) -> int:
    rows = []
    indexed_at = datetime.now(timezone.utc)
    for event in events:
        fields = normalize_fields(event.fields, event.message)
        rows.append(
            [
                str(uuid.uuid4()),
                str(organization_id),
                str(event.source_id) if event.source_id else None,
                event.timestamp or indexed_at,
                normalize_level(event.level, event.message),
                event.service or fields.get("service") or "unknown",
                event.host or fields.get("host") or "unknown",
                event.message,
                json.dumps(fields, separators=(",", ":")),
                indexed_at,
            ]
        )
    client().insert(
        "events",
        rows,
        column_names=[
            "event_id",
            "organization_id",
            "source_id",
            "timestamp",
            "level",
            "service",
            "host",
            "message",
            "fields_json",
            "indexed_at",
        ],
    )
    return len(rows)


def search_events(organization_id: uuid.UUID, query: LogSearchRequest) -> list[dict[str, Any]]:
    clauses = ["organization_id = %(organization_id)s"]
    params: dict[str, Any] = {"organization_id": str(organization_id), "limit": query.limit}
    if query.start_time:
        clauses.append("timestamp >= %(start_time)s")
        params["start_time"] = query.start_time
    if query.end_time:
        clauses.append("timestamp <= %(end_time)s")
        params["end_time"] = query.end_time
    for name in ("level", "service", "host"):
        value = getattr(query, name)
        if value:
            clauses.append(f"{name} = %({name})s")
            params[name] = value
    if query.text:
        clauses.append("positionCaseInsensitive(message, %(text)s) > 0")
        params["text"] = query.text
    for index, (field, value) in enumerate(query.fields.items()):
        key = f"field_key_{index}"
        val = f"field_val_{index}"
        clauses.append(f"JSONExtractString(fields_json, %({key})s) = %({val})s")
        params[key] = field
        params[val] = str(value)
    sql = f"""
        SELECT event_id, organization_id, source_id, timestamp, level, service, host,
               message, fields_json, indexed_at
        FROM events
        WHERE {" AND ".join(clauses)}
        ORDER BY timestamp DESC
        LIMIT %(limit)s
    """
    result = client().query(sql, parameters=params)
    return [dict(zip(result.column_names, row, strict=False)) for row in result.result_rows]


def normalize_level(level: str | None, message: str) -> str:
    cpp_level = _normalize_level_cpp(level, message)
    if cpp_level:
        return cpp_level
    if level:
        return level.lower()
    lowered = message.lower()
    for candidate in ("fatal", "error", "warn", "warning", "info", "debug", "trace"):
        if candidate in lowered:
            return "warn" if candidate == "warning" else candidate
    return "info"


def normalize_fields(fields: dict[str, Any], message: str) -> dict[str, Any]:
    normalized = dict(fields)
    if message.strip().startswith("{"):
        try:
            parsed = json.loads(message)
            if isinstance(parsed, dict):
                normalized = {**parsed, **normalized}
        except json.JSONDecodeError:
            pass
    return normalized
# Project version: LogForge V1.4



