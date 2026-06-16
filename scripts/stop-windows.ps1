# Stop and remove the Prelegal container (Windows).
$ErrorActionPreference = "Stop"

$Container = "prelegal"

Write-Host "Stopping $Container ..."
docker rm -f $Container 2>$null | Out-Null

Write-Host "Stopped."
