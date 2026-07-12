CREATE DATABASE IF NOT EXISTS logforge;

CREATE TABLE IF NOT EXISTS logforge.events
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
ORDER BY (organization_id, timestamp, level, service, host);
-- Project version: LogForge V1.4



