.PHONY: dev up down backend frontend migrate logs

dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

up:
	docker compose up --build -d

down:
	docker compose down

backend:
	docker compose up --build -d postgres redis backend

frontend:
	docker compose up --build -d frontend

logs:
	docker compose logs -f

migrate:
	docker compose exec backend alembic upgrade head

makemigrations:
	docker compose exec backend alembic revision --autogenerate -m "$(name)"

shell:
	docker compose exec backend bash

test:
	docker compose exec backend pytest

test-frontend:
	docker compose exec frontend npm run test
