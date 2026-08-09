# GymPro - Comandos de ejecución local

Este proyecto usa **FastAPI (backend)** + **React/Vite (frontend)** + **PostgreSQL + Redis**.
Docker no está instalado en esta máquina, así que se ejecuta de forma manual.
PostgreSQL/Redis están instalados vía **Scoop**.

> Nota: hay un script automatizado en `docs/gympro.ps1`. Pero los comandos
> manuales de abajo son los que puedes copiar y pegar.

---

## 0) Arranca PostgreSQL y Redis

PostgreSQL (si no está corriendo):

```powershell
& "$env:USERPROFILE\scoop\apps\postgresql\current\bin\pg_ctl.exe" -D "$env:USERPROFILE\scoop\apps\postgresql\current\data" -l "$env:USERPROFILE\scoop\apps\postgresql\current\pg.log" start
```

Redis:

```powershell
redis-server
```

Verificar que respondan (deben dar `True`):

```powershell
Test-NetConnection localhost -Port 5432 -InformationLevel Quiet
Test-NetConnection localhost -Port 6379 -InformationLevel Quiet
```

> Base de datos `gympro` y usuario `gympro/gympro_dev` ya existen.
> Migraciones ya aplicadas (revisión `004`). No hay que repetirlas.

---

## 1) Backend (FastAPI) — puerto 8000

```powershell
cd "C:\clonacion de repo proyectos\Sistema_para_gym_Py\backend"
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```

- API + Swagger: http://localhost:8000/docs

---

## 2) Frontend (React/Vite) — puerto 5173

En **otra terminal**:

```powershell
cd C:\clonacion de repo proyectos\Sistema_para_gym_Py\frontend
npm install
npm run dev
```

- Web: http://localhost:5173

---

## 3) Datos demo / usuario de acceso

Carga datos de prueba (idempotente, seguro re-ejecutar):

```powershell
cd C:\clonacion de repo proyectos\Sistema_para_gym_Py\backend
.\.venv\Scripts\python.exe scripts\create_demo_user.py
```

Credenciales demo:

| Campo   | Valor             |
| ------- | ----------------- |
| Email   | `demo@gympro.dev` |
| Password| `GymPro2026!`     |

---

## Script automatizado

En lugar de los pasos manuales:

```powershell
# Estado actual de servicios y puertos
.\docs\gympro.ps1 status

# Levantar PostgreSQL + Redis
.\docs\gympro.ps1 db

# Cargar datos demo
.\docs\gympro.ps1 seed

# Backend y frontend muestran los comandos a copiar (abren en terminales)
.\docs\gympro.ps1 backend
.\docs\gympro.ps1 frontend
```