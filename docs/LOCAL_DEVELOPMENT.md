# Local Development Guide (without Dapr)

This guide covers running the Admin Service locally without Dapr, using direct mode for simpler development and debugging.

> **Note:** This mode is suitable for basic development and debugging. For full functionality including event publishing, see [LOCAL_DEVELOPMENT_DAPR.md](./LOCAL_DEVELOPMENT_DAPR.md).

---

## Overview

This setup uses:

- **Node.js/Express development server** for the application
- **Direct HTTP connections** to downstream services (user-service, order-service)
- **Event publishing disabled** (logged only)
- Simpler configuration, good for basic development and debugging

For production-like local development with Dapr, see [Local Development with Dapr](LOCAL_DEVELOPMENT_DAPR.md).

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Initial Setup](#2-initial-setup)
3. [Environment Configuration](#3-environment-configuration)
4. [Running the Service](#4-running-the-service)
5. [Testing](#5-testing)
6. [Debugging](#6-debugging)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Prerequisites

### Required Software

| Software | Version | Purpose            | Download                            |
| -------- | ------- | ------------------ | ----------------------------------- |
| Node.js  | 20+     | JavaScript runtime | [nodejs.org](https://nodejs.org/)   |
| npm      | 10+     | Package manager    | Included with Node.js               |
| Git      | 2.40+   | Version control    | [git-scm.com](https://git-scm.com/) |

### Dependent Services (Required)

Admin Service proxies to these services, so they must be running:

| Service       | Default URL                 | Purpose          |
| ------------- | --------------------------- | ---------------- |
| User Service  | `http://localhost:8002/api` | User operations  |
| Order Service | `http://localhost:8006/api` | Order operations |
| Auth Service  | `http://localhost:8000`     | JWT validation   |

### Verify Prerequisites

```powershell
# Windows
node --version   # Should be v20.x or higher
npm --version    # Should be v10.x or higher
git --version    # Should be v2.40.x or higher
```

```bash
# Linux/macOS
node --version && npm --version && git --version
```

---

## 2. Initial Setup

### Clone the Repository

```powershell
# Windows
cd C:\gh\xshopai
git clone https://github.com/xshopai/admin-service.git
cd admin-service
```

```bash
# Linux/macOS
cd ~/projects/xshopai
git clone https://github.com/xshopai/admin-service.git
cd admin-service
```

### Install Dependencies

```bash
npm install
```

---

## 3. Environment Configuration

### Step 1: Configure Environment for Non-Dapr Mode

Copy the local environment template to `.env`:

```bash
# On Linux / Mac / Bash:
cp .env.local .env

# On Windows (PowerShell):
Copy-Item .env.local .env
```

The `.env.local` file contains:

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

# JWT Configuration (required for non-Dapr mode)
JWT_SECRET=8tDBDMcpxroHoHjXjk8xp/uAn8rzD4y8ZZremFkC4gI=
JWT_ALGORITHM=HS256
JWT_EXPIRATION=3600
JWT_ISSUER=auth-service
JWT_AUDIENCE=xshopai-platform

# Downstream Service URLs (direct connection)
USER_SERVICE_URL=http://localhost:8002/api
ORDER_SERVICE_URL=http://localhost:8006/api

# Service Tokens (for service-to-service communication)
USER_SERVICE_TOKEN=svc-user-service-4ff5876fc86cc45a18d88e5d
ORDER_SERVICE_TOKEN=svc-order-service-4ff5876fc86cc45a18d88e5d
AUTH_SERVICE_TOKEN=svc-auth-service-4ff5876fc86cc45a18d88e5d
WEB_BFF_TOKEN=svc-web-bff-4ff5876fc86cc45a18d88e5d
```

> **Note**:
>
> - Event publishing is automatically disabled without Dapr sidecar
> - `JWT_SECRET` must match the secret used by Auth Service
> - Service tokens must match tokens configured in calling services

---

## 4. Running the Service

### Start Dependent Services First

Before starting Admin Service, ensure the dependent services are running:

```powershell
# Terminal 1: Start User Service
cd C:\gh\xshopai\user-service
npm run dev

# Terminal 2: Start Order Service
cd C:\gh\xshopai\order-service
dotnet run

# Terminal 3: Start Auth Service (for JWT validation)
cd C:\gh\xshopai\auth-service
npm run dev
```

### Start Admin Service

#### Using npm Scripts

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

#### Using Run Scripts

```powershell
# Windows
.\run.ps1
```

```bash
# Linux/macOS
./run.sh
```

### Verify Service is Running

```bash
# Health check
curl http://localhost:1003/health

# Expected response:
# {"status":"healthy","service":"admin-service","version":"1.0.0"}
```

---

## 5. Testing

### Run All Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Specific Test File

```bash
npm test -- tests/unit/admin.controller.test.js
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

---

## 6. Debugging

### VS Code Debugging

1. Open the project in VS Code
2. Go to **Run and Debug** (Ctrl+Shift+D)
3. Select **"Debug Admin Service (Direct)"**
4. Press **F5** to start debugging

### Debug Configuration

The `.vscode/launch.json` should contain:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Admin Service (Direct)",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/server.js",
      "envFile": "${workspaceFolder}/.env",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Enable Debug Logging

Set `LOG_LEVEL=debug` in your `.env` file:

```env
LOG_LEVEL=debug
```

---

## 7. Troubleshooting

### Common Issues

#### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::1003
```

**Solution:**

```powershell
# Windows - Find and kill process
netstat -ano | findstr :1003
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :1003
kill -9 <PID>
```

#### Connection Refused to User Service

```
Error: connect ECONNREFUSED 127.0.0.1:8002
```

**Solution:**
Ensure User Service is running on port 8002:

```bash
# Start User Service
cd ../user-service
npm run dev
```

#### Connection Refused to Order Service

```
Error: connect ECONNREFUSED 127.0.0.1:8006
```

**Solution:**
Ensure Order Service is running on port 8006:

```bash
# Start Order Service (C#)
cd ../order-service
dotnet run --project OrderService.Api/OrderService.Api.csproj

# Or using the run script
.\run.ps1
```

#### JWT Token Invalid

```
Error: JsonWebTokenError: invalid signature
```

**Solution:**
Ensure `JWT_SECRET` in `.env` matches the secret used by Auth Service.

#### Environment Variable Not Loaded

**Solution:**

1. Verify `.env` file exists in project root
2. Check for syntax errors in `.env`
3. Restart the service after changes

### Verify Service Connectivity

```bash
# Test health endpoint
curl http://localhost:1003/health

# Test with admin token (replace with actual token)
curl -H "Authorization: Bearer <admin-jwt-token>" \
     http://localhost:1003/admin/users
```

### Logs Location

Development logs are output to the console. For file-based logging, check:

```
logs/
├── error.log    # Error-level logs
└── combined.log # All logs
```

---

## Quick Reference

| Action               | Command                 |
| -------------------- | ----------------------- |
| Install dependencies | `npm install`           |
| Start development    | `npm run dev`           |
| Start production     | `npm start`             |
| Run tests            | `npm test`              |
| Run tests (coverage) | `npm run test:coverage` |
| Lint code            | `npm run lint`          |
| Format code          | `npm run format`        |

| Endpoint     | URL                                |
| ------------ | ---------------------------------- |
| Health check | http://localhost:1003/health       |
| Admin users  | http://localhost:1003/admin/users  |
| Admin orders | http://localhost:1003/admin/orders |
