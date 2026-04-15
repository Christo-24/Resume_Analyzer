# Resume Analyser

A Django backend and Vite React frontend for resume analysis.

## Tech Stack

- Backend: Django + DRF + JWT
- Frontend: React + Vite
- Database: PostgreSQL (Docker service `db`)
- Production app server: Gunicorn

## Prerequisites

- Python 3.12+
- Node.js 20+
- Docker Desktop + Docker Compose

## Environment Setup

Copy the example environment files and fill in real values:

- `backend/.env.example` -> `backend/.env`
- `frontend/.env.example` -> `frontend/.env`

Important:

- Never commit `.env` files.
- Rotate keys immediately if any real secret was exposed.

## Run With Docker

From project root:

```powershell
docker compose up --build
```

Services started:

- `db` on `5432`
- `backend` on `8000`
- `frontend` on `5173`

Frontend URL:

- http://localhost:5173

Backend container startup flow:

1. waits for PostgreSQL
2. runs `python manage.py migrate --noinput`
3. runs `python manage.py collectstatic --noinput`
4. starts Gunicorn on `PORT` (default `8000`)

To stop:

```powershell
docker compose down
```

## HTTPS Redirect Note (Local Docker)

By default, production-style settings can force HTTPS redirects (`SECURE_SSL_REDIRECT=True`).

If you are testing locally without TLS termination, set this in `backend/.env`:

```env
SECURE_SSL_REDIRECT=False
```

For real production, keep HTTPS redirect enabled and terminate TLS at your reverse proxy/load balancer.

## Run Backend Locally (Without Docker)

From `backend`:

```powershell
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend URL:

- http://127.0.0.1:8000

## Run Frontend Locally (Without Docker)

From `frontend`:

```powershell
npm install
npm run dev
```

Frontend URL:

- http://localhost:5173

## Deploy Configuration (Render Backend + Vercel Frontend)

Production URLs:

- Frontend: https://resume-analyzer-ovzh.vercel.app
- Backend: https://resume-analyzer-h3h6.onrender.com

Set these backend environment variables on Render:

```env
DJANGO_ALLOWED_HOSTS=resume-analyzer-h3h6.onrender.com
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://resume-analyzer-ovzh.vercel.app
CSRF_TRUSTED_ORIGINS=https://resume-analyzer-ovzh.vercel.app
```

Set this frontend environment variable on Vercel:

```env
VITE_API_BASE_URL=https://resume-analyzer-h3h6.onrender.com
```

For local frontend development while keeping production values, create `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Notes:

- Redeploy backend after changing Render environment variables.
- Rebuild/redeploy frontend after changing Vite environment variables.
- In Windows PowerShell 5.1, generate requirements with UTF-8 to avoid pip parsing issues:

```powershell
pip freeze | Out-File -FilePath backend/requirements.txt -Encoding utf8
```

## Pre-Push Checklist

Before pushing to GitHub:

1. Ensure `.env` files are ignored and untracked.
2. Commit only `.env.example` templates.
3. Verify backend tests pass.
4. Verify frontend lint/build pass.
5. Verify `docker compose up --build` works end-to-end.
