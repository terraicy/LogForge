# LogForge V1.4 Deployment Notes

This public version is prepared for local/demo hosting, not production operation.

## Build

```bash
cd frontend
pnpm install
pnpm run build
```

## Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Docker

```bash
cp .env.example .env
docker compose up --build
```

## Demo Hosting

- Set `DEMO_MODE=true` and `VITE_DEMO_MODE=true`.
- Set `CORS_ORIGINS` to the hosted frontend origin.
- Do not deploy with `.env.example` secrets.
- Keep ClickHouse/PostgreSQL volumes private.
<!-- Project version: LogForge V1.4 -->
