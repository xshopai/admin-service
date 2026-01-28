<div align="center">

# 👥 Admin Service

**Enterprise-grade administrative operations microservice for the xshopai e-commerce platform**

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.1+-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0+-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Dapr](https://img.shields.io/badge/Dapr-Enabled-0D597F?style=for-the-badge&logo=dapr&logoColor=white)](https://dapr.io)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[Getting Started](#-getting-started) •
[Documentation](#-documentation) •
[API Reference](#-api-reference) •
[Contributing](#-contributing)

</div>

---

## 🎯 Overview

The **Admin Service** is a privileged microservice responsible for administrative operations including user management, role administration, and system-wide administrative functions across the xshopai platform. Built with a publisher-only pattern following Amazon's admin portal architecture, it provides REST APIs for admin actions and publishes events for audit trails.

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 👤 User Administration

- Complete user management (list, view, update, delete)
- Role and permission administration
- User status management (activate/deactivate)
- Admin-initiated password changes

</td>
<td width="50%">

### 🔐 Security & Authorization

- JWT token authentication
- Role-based access control (RBAC)
- Comprehensive authorization checks
- Admin privilege verification

</td>
</tr>
<tr>
<td width="50%">

### 📡 Event-Driven Architecture

- CloudEvents 1.0 specification
- Pub/sub messaging via Dapr
- Audit trail event publishing
- `admin.user.updated`, `admin.user.deleted` events

</td>
<td width="50%">

### 🛡️ Enterprise Compliance

- Bulk user operations
- Complete audit logging
- Structured logging for compliance
- Service-to-service authentication

</td>
</tr>
</table>

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (optional)
- Dapr CLI (for production-like setup)

### Quick Start with Docker Compose

```bash
# Clone the repository
git clone https://github.com/xshopai/admin-service.git
cd admin-service

# Start all services
docker-compose up -d

# Verify the service is healthy
curl http://localhost:1003/health
```

### Local Development Setup

<details>
<summary><b>🔧 Without Dapr (Simple Setup)</b></summary>

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the service
node src/server.js
```

</details>

<details>
<summary><b>⚡ With Dapr (Production-like)</b></summary>

```bash
# Ensure Dapr is initialized
dapr init

# Start with Dapr sidecar
npm run dev

# Or use platform-specific scripts
./run.sh       # Linux/Mac
.\run.ps1      # Windows
```

</details>

---

## 📚 Documentation

| Document                                | Description                                   |
| :-------------------------------------- | :-------------------------------------------- |
| 📘 [Environment Setup](#-configuration) | Environment variables and configuration       |
| 🔐 [Security](.github/SECURITY.md)      | Security policies and vulnerability reporting |

**API Documentation**: See `src/routes/` for endpoint definitions and `tests/` for API contract examples.

---

## 🧪 Testing

We maintain high code quality standards with comprehensive test coverage.

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

### Test Coverage

| Metric        | Status               |
| :------------ | :------------------- |
| Unit Tests    | ✅ Passing           |
| Code Coverage | ✅ Target 80%+       |
| Security Scan | ✅ 0 vulnerabilities |

---

## 🏗️ Project Structure

```
admin-service/
├── 📁 src/                       # Application source code
│   ├── 📁 controllers/           # REST API endpoints
│   ├── 📁 clients/               # External service clients
│   ├── 📁 middlewares/           # Authentication, logging, tracing
│   ├── 📁 validators/            # Input validation
│   ├── 📁 routes/                # Route definitions
│   ├── 📁 core/                  # Config, logger, errors
│   ├── 📁 utils/                 # Helper functions & utilities
│   ├── 📄 app.js                 # Express app configuration
│   └── 📄 server.js              # Entry point
├── 📁 tests/                     # Test suite
│   ├── 📁 e2e/                   # End-to-end tests
│   └── 📁 shared/                # Shared test utilities
├── 📁 .dapr/                     # Dapr configuration
│   ├── 📁 components/            # Pub/sub, secrets, state stores
│   └── 📄 config.yaml            # Dapr runtime configuration
├── 📄 docker-compose.yml         # Local containerized environment
├── 📄 Dockerfile                 # Production container image
└── 📄 package.json               # Node.js dependencies
```

---

## 🔧 Technology Stack

| Category          | Technology                      |
| :---------------- | :------------------------------ |
| 🟢 Runtime        | Node.js 20+                     |
| 🌐 Framework      | Express 5.1+                    |
| 🗄️ Database       | MongoDB 8.0+ with Mongoose ODM  |
| 📨 Messaging      | Dapr Pub/Sub (RabbitMQ backend) |
| 📋 Event Format   | CloudEvents 1.0 Specification   |
| 🔐 Authentication | JWT Tokens                      |
| 🧪 Testing        | Jest with coverage reporting    |
| 📊 Observability  | Winston structured logging      |

---

## ⚙️ Configuration

### Required Environment Variables

```bash
# Service
NODE_ENV=development              # Environment: development, production, test
PORT=1003                         # HTTP server port

# External Services
USER_SERVICE_URL=http://localhost:8002/api/users

# Security
JWT_SECRET=your-secret-key        # JWT signing secret (32+ characters)
USER_SERVICE_SECRET=shared-secret # Shared secret for service-to-service auth

# Dapr
DAPR_HTTP_PORT=3500
DAPR_GRPC_PORT=50001             # Dapr sidecar gRPC port
DAPR_APP_ID=admin-service        # Dapr application ID
```

See [.env.example](.env.example) for complete configuration options.

---

## ⚡ Quick Reference

```bash
# 🐳 Docker Compose
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose logs -f admin      # View logs

# 🟢 Local Development
npm run dev                       # Run with Dapr (recommended)
npm run debug                     # Debug with Dapr

# 🧪 Testing
npm test                          # Run all tests
npm run test:unit                 # Run unit tests
npm run test:e2e                  # Run e2e tests

# 🔍 Health Check
curl http://localhost:1003/health
curl http://localhost:3503/v1.0/invoke/admin-service/method/health
```

---

## 🏛️ Architecture

**Publisher-Only Pattern**: Following Amazon's admin portal pattern, this service:

- Provides REST API endpoints for admin actions
- Publishes events for audit/notification (`admin.user.updated`, `admin.user.deleted`)
- Does NOT consume events - it's an action center, not an event responder
- Forwards admin JWT to user-service for all privileged operations

### Related Services

| Service                                                   | Relationship                    |
| :-------------------------------------------------------- | :------------------------------ |
| [user-service](https://github.com/xshopai/user-service)   | User profile management         |
| [auth-service](https://github.com/xshopai/auth-service)   | Authentication and JWT issuance |
| [audit-service](https://github.com/xshopai/audit-service) | Audit logging                   |

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Write** tests for your changes
4. **Run** the test suite
   ```bash
   npm test && npm run lint
   ```
5. **Commit** your changes
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
6. **Push** to your branch
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open** a Pull Request

Please ensure your PR:

- ✅ Passes all existing tests
- ✅ Includes tests for new functionality
- ✅ Follows the existing code style
- ✅ Updates documentation as needed

---

## 🆘 Support

| Resource         | Link                                                                       |
| :--------------- | :------------------------------------------------------------------------- |
| 🐛 Bug Reports   | [GitHub Issues](https://github.com/xshopai/admin-service/issues)           |
| 📖 Documentation | [src/routes/](src/routes/)                                                 |
| 💬 Discussions   | [GitHub Discussions](https://github.com/xshopai/admin-service/discussions) |

---

## 📄 License

This project is part of the **xshopai** e-commerce platform.  
Licensed under the MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**[⬆ Back to Top](#-admin-service)**

Made with ❤️ by the xshopai team

</div>
