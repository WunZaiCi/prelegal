# Build the Prelegal image and run it on http://localhost:8000 (Windows).
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Image = "prelegal"
$Container = "prelegal"

Write-Host "Building $Image image..."
# On slow/blocked networks, set $env:NPM_REGISTRY (e.g. https://registry.npmmirror.com)
# to build the frontend against a mirror.
$BuildArgs = @()
if ($env:NPM_REGISTRY) {
  Write-Host "Using npm registry: $env:NPM_REGISTRY"
  $BuildArgs += @("--build-arg", "NPM_REGISTRY=$($env:NPM_REGISTRY)")
}
docker build @BuildArgs -t $Image $Root

# Replace any container left over from a previous run. Check existence first:
# `docker rm` on a missing container writes to stderr, which $ErrorActionPreference
# = "Stop" would turn into a terminating error.
if (docker ps -aq -f "name=^$Container$") {
  docker rm -f $Container | Out-Null
}

Write-Host "Starting $Container ..."
docker run -d --name $Container -p 8000:8000 $Image

Write-Host "Prelegal is running at http://localhost:8000"
