# scripts/db/start-postgres.ps1
# Starts local PostgreSQL for Vibe Music (Windows).
# Prefer installed server data dirs; otherwise bootstrap a project-local cluster.
$ErrorActionPreference = "Stop"

$port = 5432

function Test-PostgresPort([int]$TargetPort) {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect("127.0.0.1", $TargetPort, $null, $null)
        $ready = $async.AsyncWaitHandle.WaitOne(2000, $false)
        if ($ready -and $client.Connected) {
            return $true
        }
    } catch {
        return $false
    } finally {
        if ($client.Connected) { $client.Close() }
    }
    return $false
}

if (Test-PostgresPort $port) {
    Write-Host "PostgreSQL is already running on port $port." -ForegroundColor Green
    exit 0
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$localDataDir = Join-Path $repoRoot ".data\postgres"

$candidates = @(
    @{ Path = "C:\Program Files\PostgreSQL\17"; Data = "C:\Program Files\PostgreSQL\17\data" },
    @{ Path = "C:\Program Files\PostgreSQL\18"; Data = "C:\Program Files\PostgreSQL\18\data" },
    @{ Path = "C:\Program Files\PostgreSQL\17"; Data = $localDataDir }
)

$selected = $null
foreach ($c in $candidates) {
    $pgCtl = Join-Path $c.Path "bin\pg_ctl.exe"
    if (-not (Test-Path $pgCtl)) { continue }
    if (Test-Path (Join-Path $c.Data "PG_VERSION")) {
        $selected = @{ Bin = (Join-Path $c.Path "bin"); Data = $c.Data }
        break
    }
}

# Bootstrap project-local cluster when installer data dirs are missing
if (-not $selected) {
    $bin17 = "C:\Program Files\PostgreSQL\17\bin"
    $bin18 = "C:\Program Files\PostgreSQL\18\bin"
    $bin = $null
    if (Test-Path (Join-Path $bin17 "initdb.exe")) { $bin = $bin17 }
    elseif (Test-Path (Join-Path $bin18 "initdb.exe")) { $bin = $bin18 }

    if (-not $bin) {
        Write-Error "Could not locate PostgreSQL installation in 'C:\Program Files\PostgreSQL'."
        exit 1
    }

    New-Item -ItemType Directory -Force -Path $localDataDir | Out-Null
    Write-Host "Initializing project-local PostgreSQL cluster at $localDataDir ..." -ForegroundColor Cyan
    & (Join-Path $bin "initdb.exe") `
        -D $localDataDir `
        -U postgres `
        -A trust `
        --encoding=UTF8 `
        --locale=C
    if ($LASTEXITCODE -ne 0) {
        Write-Error "initdb failed with exit code $LASTEXITCODE"
        exit $LASTEXITCODE
    }
    $conf = Join-Path $localDataDir "postgresql.conf"
    if (Test-Path $conf) {
        $content = Get-Content $conf -Raw
        if ($content -notmatch "(?m)^listen_addresses\s*=") {
            Add-Content -Path $conf -Value "`nlisten_addresses = '127.0.0.1,::1'"
        }
    }
    $selected = @{ Bin = $bin; Data = $localDataDir }
}

$pgCtl = Join-Path $selected.Bin "pg_ctl.exe"
$logFile = Join-Path $selected.Data "server.log"

Write-Host "Starting PostgreSQL from $($selected.Data) ..." -ForegroundColor Cyan
& $pgCtl start -D $selected.Data -l $logFile -w -t 90
if ($LASTEXITCODE -ne 0) {
    # Already running is fine
    $running = & $pgCtl status -D $selected.Data 2>&1
    if ("$running" -notmatch "server is running") {
        Write-Warning "pg_ctl start returned $LASTEXITCODE. Status: $running"
        Write-Warning "Check log at $logFile"
    }
}

Start-Sleep -Milliseconds 300

$pgIsReady = Join-Path $selected.Bin "pg_isready.exe"
if (Test-Path $pgIsReady) {
  $deadline = (Get-Date).AddSeconds(20)
  while ((Get-Date) -lt $deadline) {
    & $pgIsReady -h 127.0.0.1 -p $port -U postgres -d postgres 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { break }
    Start-Sleep -Milliseconds 250
  }
}

if (-not (Test-PostgresPort $port)) {
    Write-Warning "Could not verify connection on port $port. Check log at $logFile"
    exit 1
}

Write-Host "PostgreSQL started successfully on port $port." -ForegroundColor Green

# Ensure vibe role/database exist for local DATABASE_URL (vibe@localhost/vibe)
$psql = Join-Path $selected.Bin "psql.exe"
if (Test-Path $psql) {
    $ensureSql = @"
DO `$`$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'vibe') THEN
    CREATE ROLE vibe LOGIN PASSWORD 'vibe' CREATEDB;
  END IF;
END
`$`$;
SELECT 'ok' WHERE EXISTS (SELECT FROM pg_database WHERE datname = 'vibe');
"@
    $dbExists = & $psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'vibe'" 2>$null
    if ("$dbExists".Trim() -ne "1") {
        Write-Host "Creating local database 'vibe' ..." -ForegroundColor Cyan
        & $psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "DO `$`$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'vibe') THEN CREATE ROLE vibe LOGIN PASSWORD 'vibe' CREATEDB; END IF; END `$`$;"
        & $psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE vibe OWNER vibe;"
    } else {
        & $psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "DO `$`$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'vibe') THEN CREATE ROLE vibe LOGIN PASSWORD 'vibe' CREATEDB; END IF; END `$`$;" | Out-Null
    }
    Write-Host "Local role/database 'vibe' is ready." -ForegroundColor Green
}

exit 0
