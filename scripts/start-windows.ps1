# Build the Prelegal image and run it on http://localhost:8000 (Windows).
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Image = "prelegal"
$Container = "prelegal"

Write-Host "Building $Image image..."
docker build -t $Image $Root

# Replace any container left over from a previous run.
docker rm -f $Container 2>$null | Out-Null

Write-Host "Starting $Container ..."
docker run -d --name $Container -p 8000:8000 $Image

Write-Host "Prelegal is running at http://localhost:8000"
