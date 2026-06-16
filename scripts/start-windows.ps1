# Build the Prelegal image and run it on http://localhost:8000 (Windows).
#
# We deliberately do NOT set $ErrorActionPreference = "Stop": Docker writes
# benign progress/warning lines (e.g. "http2: server: error reading preface")
# to stderr, which "Stop" would promote into terminating errors and abort the
# script. We check $LASTEXITCODE after the docker commands instead.

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
if ($LASTEXITCODE -ne 0) { Write-Error "docker build failed (exit $LASTEXITCODE)"; exit 1 }

# Replace any container left over from a previous run.
if (docker ps -aq -f "name=^$Container$") {
  docker rm -f $Container | Out-Null
}

Write-Host "Starting $Container ..."
# Pass secrets (e.g. CEREBRAS_API_KEY) from .env into the container at runtime.
# The file is gitignored and never baked into the image.
$RunArgs = @("-d", "--name", $Container, "-p", "8000:8000")
$EnvFile = Join-Path $Root ".env"
if (Test-Path $EnvFile) {
  Write-Host "Loading secrets from .env"
  $RunArgs += @("--env-file", $EnvFile)
} else {
  Write-Host "No .env found - AI chat will be disabled (set CEREBRAS_API_KEY in .env)."
}
docker run @RunArgs $Image
if ($LASTEXITCODE -ne 0) { Write-Error "docker run failed (exit $LASTEXITCODE)"; exit 1 }

Write-Host "Prelegal is running at http://localhost:8000"
