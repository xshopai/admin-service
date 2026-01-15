# 👥 Admin Service

Administrative operations microservice for xshopai - handles privileged user management, role administration, and system-wide administrative operations.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **Dapr CLI** 1.16+ ([Install Guide](https://docs.dapr.io/getting-started/install-dapr-cli/))

### Setup

**1. Clone & Install**
```bash
git clone https://github.com/xshopai/admin-service.git
cd admin-service
npm install
```

**2. Configure Environment**
```bash
# Copy environment template
cp .env.example .env

# Edit .env - update these values:
# USER_SERVICE_URL=http://localhost:8002/api/users
# JWT_SECRET=your-secret-key-change-in-production
```

**3. Initialize Dapr**
```bash
# First time only
dapr init
```

**4. Run Service**
```bash
# Start with Dapr (recommended)
npm run dev

# Or use platform-specific scripts
./run.sh       # Linux/Mac
.\run.ps1      # Windows
```

**5. Verify**
```bash
# Check health
curl http://localhost:1003/health

# Should return: {"status":"UP","service":"admin-service"...}

# Via Dapr
curl http://localhost:3503/v1.0/invoke/admin-service/method/health
```

### Common Commands

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Lint code
npm run lint

# Production mode
npm start
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [📖 Developer Guide](docs/DEVELOPER_GUIDE.md) | Local setup, debugging, daily workflows |
| [📘 Technical Reference](docs/TECHNICAL.md) | Architecture, security, monitoring |
| [🤝 Contributing](docs/CONTRIBUTING.md) | Contribution guidelines and workflow |

**API Documentation**: See `src/routes/` for endpoint definitions and `tests/integration/` for API contract examples.

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
DAPR_HTTP_PORT=3503              # Dapr sidecar HTTP port
DAPR_GRPC_PORT=50003             # Dapr sidecar gRPC port
DAPR_APP_ID=admin-service        # Dapr application ID
```

See [.env.example](.env.example) for complete configuration options.

## ✨ Key Features

- User management (list, view, update, delete)
- Role and permission administration
- User status management (activate/deactivate)
- Admin-initiated password changes
- Bulk user operations
- Event publishing for audit trails
- Comprehensive authorization checks
- Structured logging for compliance

## 🏗️ Architecture

**Publisher-Only Pattern**: Following Amazon's admin portal pattern, this service:
- Provides REST API endpoints for admin actions
- Publishes events for audit/notification (`admin.user.updated`, `admin.user.deleted`)
- Does NOT consume events - it's an action center, not an event responder
- Forwards admin JWT to user-service for all privileged operations

## 🔗 Related Services

- [user-service](https://github.com/xshopai/user-service) - User profile management
- [auth-service](https://github.com/xshopai/auth-service) - Authentication and JWT issuance
- [audit-service](https://github.com/xshopai/audit-service) - Audit logging

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/xshopai/admin-service/issues)
- **Discussions**: [GitHub Discussions](https://github.com/xshopai/admin-service/discussions)
- **Documentation**: [docs/](docs/)
