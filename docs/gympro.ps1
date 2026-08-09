# ============================================================
#  GymPro - Script de arranque (Windows / PowerShell)
#  Uso (desde la raiz del proyecto):
#      .\docs\gympro.ps1 db        -> levanta PostgreSQL y Redis
#      .\docs\gympro.ps1 backend    -> ejecuta el backend (Dry run)
#      .\docs\gympro.ps1 frontend   -> ejecuta el frontend (Dry run)
#      .\docs\gympro.ps1 seed       -> carga datos demo
#      .\docs\gympro.ps1 all        -> base de datos + seed + simulacro de todo
# ============================================================

param(
    [Parameter(Position = 0)]
    [ValidateSet("status", "db", "seed", "backend", "frontend", "all", "setup")]
    [string]$Action = "status"
)

$Root     = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Backend  = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"

# --- Rutas de herramientas instaladas via Scoop ------------------
$PG_BIN     = Get-ChildItem "$env:USERPROFILE\scoop\apps\postgresql\current\bin" -ErrorAction SilentlyContinue
$PGBIN      = if ($PG_BIN) { (Get-ChildItem "$env:USERPROFILE\scoop\apps\postgresql\current\bin\psql.exe" -ErrorAction SilentlyContinue).FullName } else { "psql" }
$PGDATA     = "$env:USERPROFILE\scoop\apps\postgresql\current\data"
$PG_CTL     = if ($PG_BIN) { (Get-ChildItem "$env:USERPROFILE\scoop\apps\postgresql\current\bin\pg_ctl.exe" -ErrorAction SilentlyContinue).FullName } else { "pg_ctl" }

function Wait-Port([int]$port, [int]$seconds = 20) {
    for ($i = 0; $i -lt $seconds; $i++) {
        if (Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet) { return $true }
        Start-Sleep -Seconds 1
    }
    return $false
}

function Invoke-Status {
    $pg = if (Wait-Port 5432 2) { "OK" } else { "DOWN" }
    $rd = if (Wait-Port 6379 2) { "OK" } else { "DOWN" }
    $be = if (Wait-Port 8000 2) { "OK (arriba)" } else { "DOWN" }
    $fe = if (Wait-Port 5173 2) { "OK (arriba)" } else { "DOWN" }
    "PostgreSQL (5432): $pg"
    "Redis       (6379): $rd"
    "Backend     (8000): $be"
    "Frontend    (5173): $fe"
}

function Invoke-Db {
    if (-not (Wait-Port 5432 2)) {
        Write-Host "Arrancando PostgreSQL..." -ForegroundColor Cyan
        & $PG_CTL -D $PGDATA -l (Join-Path (Split-Path $PGDATA -Parent) "pg.log") start
    }
    Start-Process -WindowStyle Minimized -FilePath "redis-server" | Out-Null
    Start-Sleep 2
    if (Wait-Port 5432 10) { "PostgreSQL listo." } else { "No se pudo conectar a PostgreSQL." }
    if (Wait-Port 6379 10) { "Redis listo." } else { "Redis no responde (revisa redis-server)." }
}

function Invoke-Seed {
    Set-Location $Backend
    & ".\.venv\Scripts\python.exe" "scripts\create_demo_user.py"
}

function Invoke-Backend {
    Set-Location $Backend
    Write-Host "Ejecuta en otra terminal:" -ForegroundColor Yellow
    "cd `"$Backend`""
    ".\.venv\Scripts\Activate.ps1"
    "python -m uvicorn app.main:app --reload"
}

function Invoke-Frontend {
    Set-Location $Frontend
    if (-not (Test-Path "node_modules")) {
        Write-Host "Instalando dependencias..." -ForegroundColor Cyan
        npm install
    }
    Write-Host "Ejecuta en otra terminal:" -ForegroundColor Yellow
    "cd `"$Frontend`""
    "npm run dev"
}

function Invoke-Setup {
    Invoke-Db
    Invoke-Seed
}

switch ($Action) {
    "status"   { Invoke-Status }
    "db"       { Invoke-Db }
    "seed"     { Invoke-Seed }
    "backend"  { Invoke-Backend }
    "frontend" { Invoke-Frontend }
    "all"      { Invoke-Db; Invoke-Seed; Invoke-Backend; Invoke-Frontend }
    "setup"    { Invoke-Setup }
}