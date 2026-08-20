# Setup & ejecución

## Requisitos

- Docker + Docker Compose
- Node.js 20+ (solo para dev frontend sin Docker)

## Backend (Docker)

```bash
# Copiar env (raíz — usado por docker-compose.yml para SECRET_KEY/DB_PASSWORD)
cp .env.example .env

# Copiar env backend
cp backend/.env.example backend/.env

# Levantar todo
docker compose up --build

# Correr migraciones
make migrate

# Tests
make test
```

El backend queda en `http://localhost:8000`.

## Frontend (Docker)

Ya incluido en `docker compose up`. Se sirve en `http://localhost:5173`.

## Frontend standalone (sin Docker)

```bash
cd frontend
npm install

# Modo dev normal (contra backend en localhost:8000)
npm run dev

# Modo mock (sin backend, datos de mentira)
npm run dev:mock
# Credenciales: admin@gympro.dev / preview1234
```

## Backend standalone (sin Docker)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate     # Windows
pip install -r requirements.txt

# Necesitás Postgres y Redis corriendo
# Editar backend/.env con DATABASE_URL y REDIS_URL locales

alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

## Comandos útiles

| Comando | Qué hace |
|---|---|
| `make dev` | Up con live-reload |
| `make migrate` | Alembic upgrade head |
| `make test` | Tests backend |
| `make logs` | Logs de todos los servicios |
| `npm run dev:mock` | Frontend mock mode |
