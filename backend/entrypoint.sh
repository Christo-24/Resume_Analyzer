#!/bin/sh
set -e

PORT="${PORT:-8000}"

# Wait for Postgres when using postgres backend.
if [ "${DB_ENGINE}" = "django.db.backends.postgresql" ] || [ -n "${DB_HOST}" ]; then
  DB_HOST="${DB_HOST:-db}"
  DB_PORT="${DB_PORT:-5432}"
  echo "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
  until pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER:-postgres}" >/dev/null 2>&1; do
    sleep 1
  done
fi

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn on port ${PORT}..."
exec gunicorn config.wsgi:application --bind "0.0.0.0:${PORT}" --workers "${GUNICORN_WORKERS:-3}" --timeout "${GUNICORN_TIMEOUT:-120}"
