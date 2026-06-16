# Stop and remove the Prelegal container (Windows).
$ErrorActionPreference = "Stop"

$Container = "prelegal"

Write-Host "Stopping $Container ..."
# Only remove if it exists — `docker rm` on a missing container writes to stderr,
# which $ErrorActionPreference = "Stop" would turn into a terminating error.
if (docker ps -aq -f "name=^$Container$") {
  docker rm -f $Container | Out-Null
  Write-Host "Stopped."
} else {
  Write-Host "Not running."
}
