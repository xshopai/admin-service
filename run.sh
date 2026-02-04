#!/bin/bash

# Admin Service - Run with Dapr

echo "Starting Admin Service with Dapr..."
echo "Service will be available at: http://localhost:8003"
echo "Dapr HTTP endpoint: http://localhost:3503"
echo "Dapr gRPC endpoint: localhost:50003"
echo ""

dapr run \
  --app-id admin-service \
  --app-port 8003 \
  --dapr-http-port 3503 \
  --dapr-grpc-port 50003 \
  --log-level info \
  --config ./.dapr/config.yaml \
  --resources-path ./.dapr/components \
  -- node src/server.js
