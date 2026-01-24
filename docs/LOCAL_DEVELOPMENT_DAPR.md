# Local Development with Dapr

This guide shows how to run the Admin Service locally **with Dapr sidecar** for a production-like environment with event-driven messaging.

> **Note:** For basic development without event publishing, see [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md).

---

## Overview

This setup uses:

- **Dapr sidecar** for pub/sub messaging
- **RabbitMQ** as the Dapr pub/sub backing store
- Production-like event handling with proper dead letter queues

For simpler development without Dapr, see [Local Development (without Dapr)](LOCAL_DEVELOPMENT.md).

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Dapr Setup](#2-dapr-setup)
3. [Environment Configuration](#3-environment-configuration)
4. [Infrastructure Setup](#4-infrastructure-setup)
5. [Running with Dapr](#5-running-with-dapr)
6. [Verifying Event Publishing](#6-verifying-event-publishing)
7. [Debugging with Dapr](#7-debugging-with-dapr)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

### Required Software

| Software       | Version | Purpose                | Download                                                          |
| -------------- | ------- | ---------------------- | ----------------------------------------------------------------- |
| Node.js        | 20+     | JavaScript runtime     | [nodejs.org](https://nodejs.org/)                                 |
| npm            | 10+     | Package manager        | Included with Node.js                                             |
| Docker Desktop | 4.20+   | Container runtime      | [docker.com](https://www.docker.com/products/docker-desktop/)     |
| Dapr CLI       | 1.12+   | Dapr command line tool | [dapr.io](https://docs.dapr.io/getting-started/install-dapr-cli/) |
| Git            | 2.40+   | Version control        | [git-scm.com](https://git-scm.com/)                               |

### Verify Prerequisites

```powershell
# Windows
node --version   # Should be v20.x or higher
npm --version    # Should be v10.x or higher
docker --version # Should be v24.x or higher
dapr --version   # Should be v1.12.x or higher
```

```bash
# Linux/macOS
node --version && npm --version && docker --version && dapr --version
```

---

## 2. Dapr Setup

### Initialize Dapr

If running Dapr for the first time:

```bash
# Initialize Dapr (installs Redis, Zipkin containers)
dapr init

# Verify Dapr installation
dapr --version
```

### Dapr Components

Admin Service uses these Dapr components located in `.dapr/components/`:

| Component    | File                | Purpose            |
| ------------ | ------------------- | ------------------ |
| Event Bus    | `event-bus.yaml`    | RabbitMQ pub/sub   |
| Secret Store | `secret-store.yaml` | Local file secrets |

### Event Bus Configuration

File: `.dapr/components/event-bus.yaml`

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: event-bus
spec:
  type: pubsub.rabbitmq
  version: v1
  metadata:
    - name: connectionString
      value: 'amqp://guest:guest@127.0.0.1:5672'
    - name: consumerID
      value: 'admin-service'
    - name: durable
      value: 'true'
    - name: deliveryMode
      value: '2'
scopes:
  - admin-service
```

### Dapr Configuration

File: `.dapr/config.yaml`

```yaml
apiVersion: dapr.io/v1alpha1
kind: Configuration
metadata:
  name: admin-service-config
spec:
  tracing:
    samplingRate: '1'
    zipkin:
      endpointAddress: 'http://localhost:9411/api/v2/spans'
  features:
    - name: AppHealthCheck
      enabled: true
```

---

## 3. Environment Configuration

Copy the Dapr environment template to `.env`:

```bash
# On Linux / Mac / Bash:
cp .env.dapr .env

# On Windows (PowerShell):
Copy-Item .env.dapr .env
```

The `.env.dapr` file contains:

```bash
NODE_ENV=development
PORT=1003
NAME=admin-service
VERSION=1.0.0

LOG_LEVEL=debug
LOG_FORMAT=console
LOG_TO_CONSOLE=true
LOG_TO_FILE=false
LOG_FILE_PATH=./logs/admin-service.log

# Dapr Configuration
DAPR_HOST=localhost
DAPR_HTTP_PORT=3503
DAPR_GRPC_PORT=50003
DAPR_APP_ID=admin-service
DAPR_PUBSUB_NAME=event-bus

# JWT Configuration (algorithm/issuer/audience - secret from Dapr secret store)
JWT_ALGORITHM=HS256
JWT_EXPIRATION=3600
JWT_ISSUER=auth-service
JWT_AUDIENCE=xshopai-platform

# Service Tokens (for service-to-service communication)
USER_SERVICE_TOKEN=svc-user-service-4ff5876fc86cc45a18d88e5d
ORDER_SERVICE_TOKEN=svc-order-service-4ff5876fc86cc45a18d88e5d
AUTH_SERVICE_TOKEN=svc-auth-service-4ff5876fc86cc45a18d88e5d
WEB_BFF_TOKEN=svc-web-bff-4ff5876fc86cc45a18d88e5d
```

> **Note**:
>
> - When using Dapr mode, `JWT_SECRET` is retrieved from the Dapr secret store (configured in `.dapr/secrets.json`)
> - The Dapr sidecar handles RabbitMQ connections using the configuration in `.dapr/components/event-bus.yaml`
> - If Dapr secret store fails, the service falls back to environment variables

---

## 4. Infrastructure Setup

### Start RabbitMQ

Admin Service requires RabbitMQ for event publishing:

```powershell
# Windows
cd C:\gh\xshopai\scripts\docker-compose
docker compose -f docker-compose.infrastructure.yml up rabbitmq -d
```

```bash
# Linux/macOS
cd ~/projects/xshopai/scripts/docker-compose
docker compose -f docker-compose.infrastructure.yml up rabbitmq -d
```

### Verify RabbitMQ is Running

```bash
# Check RabbitMQ container
docker ps | grep rabbitmq

# Access RabbitMQ Management UI
# URL: http://localhost:15672
# Username: guest
# Password: guest
```

### Start Dependent Services

Admin Service proxies to these services:

```powershell
# Terminal 1: Start User Service (with Dapr)
cd C:\gh\xshopai\user-service
dapr run --app-id user-service --app-port 8002 --dapr-http-port 3502 --resources-path .dapr/components -- npm run dev

# Terminal 2: Start Order Service (with Dapr)
cd C:\gh\xshopai\order-service
dapr run --app-id order-service --app-port 8006 --dapr-http-port 3506 --resources-path .dapr/components -- dotnet run

# Terminal 3: Start Audit Service (event consumer)
cd C:\gh\xshopai\audit-service
dapr run --app-id audit-service --app-port 8010 --dapr-http-port 3510 --resources-path .dapr/components -- npm run dev
```

---

## 5. Running with Dapr

### Method 1: Using VS Code Tasks

1. Open VS Code in admin-service folder
2. Press **Ctrl+Shift+P** → **Tasks: Run Task**
3. Select **"Start Dapr Sidecar"**
4. In another terminal, start the Node.js app: `npm run dev`

### Method 2: Using Dapr CLI

```powershell
# Windows
dapr run `
  --app-id admin-service `
  --app-port 1003 `
  --dapr-http-port 3503 `
  --dapr-grpc-port 50003 `
  --resources-path .dapr/components `
  --config .dapr/config.yaml `
  --log-level warn `
  -- npm run dev
```

```bash
# Linux/macOS
dapr run \
  --app-id admin-service \
  --app-port 1003 \
  --dapr-http-port 3503 \
  --dapr-grpc-port 50003 \
  --resources-path .dapr/components \
  --config .dapr/config.yaml \
  --log-level warn \
  -- npm run dev
```

### Method 3: Two-Terminal Approach (Recommended for Debugging)

**Terminal 1: Start Dapr Sidecar Only**

```powershell
# Windows
dapr run `
  --app-id admin-service `
  --app-port 1003 `
  --dapr-http-port 3503 `
  --dapr-grpc-port 50003 `
  --resources-path .dapr/components `
  --config .dapr/config.yaml `
  --log-level warn
```

**Terminal 2: Start Node.js Application**

```bash
npm run dev
```

### Verify Dapr Sidecar is Running

```bash
# Check Dapr dashboard
dapr dashboard

# Or check via CLI
dapr list

# Expected output:
# APP ID          HTTP PORT  GRPC PORT  APP PORT  COMMAND  AGE  CREATED
# admin-service   3503       50003      1003      npm run  10s  2025-01-01 10:00:00
```

---

## 6. Verifying Event Publishing

### Test Event Publishing

1. **Make an admin API call that triggers an event:**

```bash
# Update a user (triggers admin.user.updated event)
curl -X PATCH http://localhost:1003/admin/users/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <admin-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Updated Name"}'
```

2. **Check RabbitMQ Management UI:**

- URL: http://localhost:15672
- Navigate to Queues
- Look for messages in `admin-service` queues

3. **Check Audit Service Logs:**

If Audit Service is running, it should log received events:

```
[INFO] Received event: admin.user.updated
[INFO] Actor: admin-123, Target: 507f1f77bcf86cd799439011
```

### Monitor Pub/Sub via Dapr Dashboard

```bash
# Open Dapr dashboard
dapr dashboard

# Navigate to Components → event-bus
# View published messages
```

---

## 7. Debugging with Dapr

### VS Code Debug Configuration

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Admin Service (with Dapr)",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/server.js",
      "envFile": "${workspaceFolder}/.env",
      "env": {
        "DAPR_HTTP_PORT": "3503",
        "DAPR_GRPC_PORT": "50003",
        "DAPR_ENABLED": "true"
      },
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"],
      "preLaunchTask": "Start Dapr Sidecar",
      "postDebugTask": "Stop Dapr Sidecar"
    }
  ]
}
```

### Debug Steps

1. Start Dapr sidecar in Terminal 1 (see Method 3 above)
2. In VS Code, select **"Debug Admin Service (with Dapr)"**
3. Press **F5** to start debugging
4. Set breakpoints in event publishing code

### Viewing Traces in Zipkin

If Zipkin is running (started with `dapr init`):

1. Open http://localhost:9411
2. Click "Run Query" to see recent traces
3. Filter by service name: `admin-service`

---

## 8. Troubleshooting

### Dapr Sidecar Not Starting

```
Error: error loading components: component event-bus not found
```

**Solution:**
Verify components path exists:

```bash
ls -la .dapr/components/
# Should show event-bus.yaml, secret-store.yaml
```

### Cannot Connect to RabbitMQ

```
Error: ECONNREFUSED 127.0.0.1:5672
```

**Solution:**
Start RabbitMQ container:

```bash
docker compose -f scripts/docker-compose/docker-compose.infrastructure.yml up rabbitmq -d
```

### Events Not Publishing

**Diagnostic Steps:**

1. Check Dapr sidecar is running:

   ```bash
   dapr list
   ```

2. Check Dapr sidecar logs:

   ```bash
   dapr logs --app-id admin-service
   ```

3. Verify RabbitMQ connection in component:
   ```yaml
   # .dapr/components/event-bus.yaml
   - name: connectionString
     value: 'amqp://guest:guest@127.0.0.1:5672'
   ```

### Port Conflicts

```
Error: listen EADDRINUSE :::3503
```

**Solution:**

```powershell
# Windows - Find and kill Dapr processes
Get-Process -Name daprd -ErrorAction SilentlyContinue | Stop-Process -Force

# Linux/macOS
pkill daprd
```

### Dapr Dashboard Not Opening

```bash
# Try alternative port
dapr dashboard -p 9999

# Access at http://localhost:9999
```

---

## Quick Reference

### Dapr Commands

| Command                               | Purpose                        |
| ------------------------------------- | ------------------------------ |
| `dapr init`                           | Initialize Dapr                |
| `dapr run --app-id admin-service ...` | Run with Dapr sidecar          |
| `dapr list`                           | List running Dapr applications |
| `dapr stop --app-id admin-service`    | Stop Dapr sidecar              |
| `dapr dashboard`                      | Open Dapr dashboard            |
| `dapr logs --app-id admin-service`    | View Dapr sidecar logs         |

### Port Reference

| Port  | Service                |
| ----- | ---------------------- |
| 1003  | Admin Service (HTTP)   |
| 3503  | Dapr Sidecar (HTTP)    |
| 50003 | Dapr Sidecar (gRPC)    |
| 5672  | RabbitMQ (AMQP)        |
| 15672 | RabbitMQ Management UI |
| 9411  | Zipkin Tracing UI      |

### VS Code Tasks

| Task               | Purpose                 |
| ------------------ | ----------------------- |
| Start Dapr Sidecar | Start Dapr without app  |
| Stop Dapr Sidecar  | Stop all Dapr processes |

### Published Events

| Event                 | Trigger               |
| --------------------- | --------------------- |
| `admin.user.updated`  | User update via API   |
| `admin.user.deleted`  | User deletion via API |
| `admin.order.updated` | Order status update   |
| `admin.order.deleted` | Order deletion        |
