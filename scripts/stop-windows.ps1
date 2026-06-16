# Stop and remove the Prelegal container (Windows).
#
# No $ErrorActionPreference = "Stop": Docker may write benign lines to stderr
# which would otherwise be promoted to terminating errors.

$Container = "prelegal"

Write-Host "Stopping $Container ..."
# Only remove if it exists, so a missing container isn't treated as an error.
if (docker ps -aq -f "name=^$Container$") {
  docker rm -f $Container | Out-Null
  Write-Host "Stopped."
} else {
  Write-Host "Not running."
}
