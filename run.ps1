#!/usr/bin/env pwsh
# Run Admin Service with Dapr sidecar
# Usage: .\run.ps1

# Set terminal title - use both methods to ensure it persists
$host.ui.RawUI.WindowTitle = "Admin Service"
[Console]::Title = "Admin Service"

Write-Host "Starting Admin Service with Dapr..." -ForegroundColor Green
Write-Host "Service will be available at: http://localhost:8003" -ForegroundColor Cyan
Write-Host "Dapr HTTP endpoint: http://localhost:3503" -ForegroundColor Cyan
Write-Host "Dapr gRPC endpoint: localhost:50003" -ForegroundColor Cyan
Write-Host ""

dapr run `
  --app-id admin-service `
  --app-port 8003 `
  --dapr-http-port 3503 `
  --dapr-grpc-port 50003 `
  --resources-path .dapr/components `
  --config .dapr/config.yaml `
  --log-level warn `
  -- nodemon src/server.js
