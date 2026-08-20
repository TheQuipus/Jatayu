# Refresh docker/mysql/init/01-jatayu_db.sql from the live local MySQL (jatayu_db).
$ErrorActionPreference = "Stop"
$mysqlBin = "C:\Program Files\MySQL\MySQL Server 8.4\bin"
$outDir = Join-Path $PSScriptRoot "..\docker\mysql\init"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$outFile = Join-Path $outDir "01-jatayu_db.sql"

$dump = Join-Path $mysqlBin "mysqldump.exe"
if (-not (Test-Path $dump)) {
    throw "mysqldump not found at $dump"
}

$tmp = Join-Path $outDir "01-jatayu_db.sql.tmp"
& cmd.exe /c "`"$dump`" -h 127.0.0.1 -u root --single-transaction --routines --no-tablespaces --set-gtid-purged=OFF --databases jatayu_db > `"$tmp`""
if ($LASTEXITCODE -ne 0) { throw "mysqldump failed with exit $LASTEXITCODE" }
Move-Item -Force $tmp $outFile
Write-Output "Wrote $outFile ($((Get-Item $outFile).Length) bytes)"
Write-Output "This file contains live app data (users, settings keys). Do not push it to a public repo."
