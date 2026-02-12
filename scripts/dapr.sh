#!/bin/bash

# Admin Service - Run with Dapr Pub/Sub

echo "Starting Admin Service (Dapr Pub/Sub)..."
echo "Service will be available at: http://localhost:8003"
echo "Dapr HTTP endpoint: http://localhost:3503"
echo "Dapr gRPC endpoint: localhost:50003"
echo ""

# Kill any processes using required ports (prevents "address already in use" errors)
for PORT in 8003 3503 50003; do
    for pid in $(netstat -ano 2>/dev/null | grep ":$PORT" | grep LISTENING | awk '{print $5}' | sort -u); do
        echo "Killing process $pid on port $PORT..."
        taskkill //F //PID $pid 2>/dev/null
    done
done

dapr run \
  --app-id admin-service \
  --app-port 8003 \
  --dapr-http-port 3503 \
  --dapr-grpc-port 50003 \
  --log-level info \
  --config ./.dapr/config.yaml \
  --resources-path ./.dapr/components \
  -- node src/server.js
