#!/bin/sh

set -e

echo "Collecting static files..."
python manage.py collectstatic --no-input

echo "Waiting for database..."
python manage.py wait_for_database

echo "Creating migrations for database..."
python manage.py makemigrations 

echo "Applying database migrations..."
python manage.py migrate

echo "Starting server..."
exec "$@"
