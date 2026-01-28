# Admin Service - Architecture Document

## Table of Contents

1. [Overview](#1-overview)
   - 1.1 [Purpose](#11-purpose)
   - 1.2 [Scope](#12-scope)
   - 1.3 [Service Summary](#13-service-summary)
   - 1.4 [Directory Structure](#14-directory-structure)
   - 1.5 [Key Responsibilities](#15-key-responsibilities)
   - 1.6 [References](#16-references)
2. [System Context](#2-system-context)
   - 2.1 [Context Diagram](#21-context-diagram)
   - 2.2 [External Interfaces](#22-external-interfaces)
   - 2.3 [Dependencies](#23-dependencies)
3. [API Design](#3-api-design)
   - 3.1 [Endpoint Summary](#31-endpoint-summary)
   - 3.2 [Request/Response Specifications](#32-requestresponse-specifications)
   - 3.3 [Error Response Format](#33-error-response-format)
   - 3.4 [Error Code Reference](#34-error-code-reference)
   - 3.5 [Authentication](#35-authentication)
4. [Event Architecture](#4-event-architecture)
   - 4.1 [Event Summary](#41-event-summary)
   - 4.2 [Published Events](#42-published-events)
   - 4.3 [Dapr Configuration](#43-dapr-configuration)
5. [Configuration](#5-configuration)
   - 5.1 [Environment Variables](#51-environment-variables)
6. [Deployment](#6-deployment)
   - 6.1 [Deployment Targets](#61-deployment-targets)
7. [Observability](#7-observability)
   - 7.1 [Distributed Tracing](#71-distributed-tracing)
   - 7.2 [Structured Logging](#72-structured-logging)
   - 7.3 [Metrics & Alerting](#73-metrics--alerting)
8. [Security](#8-security)
   - 8.1 [Authentication](#81-authentication)
   - 8.2 [Authorization](#82-authorization)
   - 8.3 [Input Validation](#83-input-validation)

---

## 1. Overview

### 1.1 Purpose

The Admin Service is a privileged microservice within the xshopai e-commerce platform responsible for administrative operations. Following Amazon's admin portal pattern, it serves as an **action center** that provides REST APIs for admin operations while publishing events for audit trails. It does NOT consume events - it's a publisher-only service.

### 1.2 Scope

#### In Scope

- User management (list, view, update, delete users via user-service)
- Order management (list, view, update status, delete via order-service)
- Product management (list, view, create, update, delete, variations, badges, bulk operations via product-service)
- Role and permission administration
- User status management (activate/deactivate)
- Admin-initiated password changes
- Event publishing for audit trails
- Authorization enforcement

#### Out of Scope

- User authentication (handled by Auth Service)
- User self-service operations (handled by User Service)
- Order creation and processing (handled by Order Service)
- Product data storage (data owned by Product Service)
- Inventory management (handled by Inventory Service)
- Event consumption (publisher-only pattern)

### 1.3 Service Summary

| Attribute      | Value                                                          |
| -------------- | -------------------------------------------------------------- |
| Service Name   | admin-service                                                  |
| Tech Stack     | Node.js 20+ / Express 5.1.0                                    |
| Database       | None (proxies to user-service, order-service, product-service) |
| Authentication | JWT (validated locally, forwarded to services)                 |
| API Docs       | OpenAPI/Swagger                                                |
| Messaging      | Dapr Pub/Sub (RabbitMQ backend)                                |
| Main Port      | 1003                                                           |
| Dapr HTTP Port | 3500                                                           |
| Dapr gRPC Port | 50001                                                          |

> **Note:** All services now use the standard Dapr ports (3500 for HTTP, 50001 for gRPC). This simplifies configuration and works consistently whether running via Docker Compose or individual service runs.

### 1.4 Directory Structure

```
admin-service/
├── .dapr/                      # Dapr configuration
│   ├── components/             # Pub/sub, secret store
│   │   ├── event-bus.yaml      # RabbitMQ pub/sub component
│   │   └── secret-store.yaml   # Local secrets component
│   └── config.yaml             # Dapr configuration
├── .github/                    # GitHub workflows and copilot instructions
├── .vscode/                    # VS Code settings and tasks
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md         # This file
│   ├── PRD.md                  # Product requirements document
│   ├── LOCAL_DEVELOPMENT.md    # Local setup without Dapr
│   └── LOCAL_DEVELOPMENT_DAPR.md # Local setup with Dapr
├── src/                        # Application source code
│   ├── clients/                # Service clients (user, order)
│   │   ├── user.service.client.js
│   │   └── order.service.client.js
│   ├── controllers/            # API endpoint handlers
│   │   ├── admin.controller.js
│   │   ├── home.controller.js
│   │   └── operational.controller.js
│   ├── core/                   # Core utilities
│   │   ├── config.js           # Configuration management
│   │   ├── errors.js           # Error classes
│   │   └── logger.js           # Winston logger setup
│   ├── middlewares/            # Express middleware
│   │   ├── async.handler.js    # Async error handling
│   │   ├── auth.middleware.js  # JWT authentication
│   │   └── error.handler.js    # Global error handler
│   ├── routes/                 # Route definitions
│   │   ├── admin.routes.js
│   │   ├── home.routes.js
│   │   └── operational.routes.js
│   ├── utils/                  # Helper functions
│   ├── validators/             # Input validation
│   │   └── admin.validator.js
│   ├── app.js                  # Express app configuration
│   └── server.js               # Application entry point
├── tests/                      # Test suite
│   ├── e2e/                    # End-to-end tests
│   └── shared/                 # Shared test utilities
├── docker-compose.yml          # Local development setup
├── Dockerfile                  # Container build instructions
├── package.json                # Dependencies and scripts
├── run.ps1                     # Windows run script
└── run.sh                      # Linux/macOS run script
```

### 1.5 Key Responsibilities

1. **User Administration** - Proxy admin operations to user-service (list, view, update, delete users)
2. **Order Administration** - Proxy admin operations to order-service (list, view, update status, delete orders)
3. **Product Administration** - Proxy admin operations to product-service (CRUD, variations, badges, bulk operations)
4. **Authorization Enforcement** - Verify admin JWT before forwarding to downstream services
5. **Event Publishing** - Publish `admin.user.*`, `admin.order.*`, and `admin.product.*` events for audit logging
6. **Input Validation** - Validate request payloads before forwarding to services

### 1.6 References

| Document             | Link                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| PRD                  | [docs/PRD.md](./PRD.md)                                               |
| Copilot Instructions | [.github/copilot-instructions.md](../.github/copilot-instructions.md) |

---

## 2. System Context

### 2.1 Context Diagram

```mermaid
flowchart TB
    subgraph Users["<b>👤 USERS</b>"]
        Admin[("🧑‍💼 Admin User")]
    end

    subgraph Clients["<b>📱 CLIENT APPLICATIONS</b>"]
        AdminUI["🖥️ Admin UI<br/><i>Web Interface</i>"]
    end

    subgraph Core["<b>🎯 CORE SERVICE</b>"]
        ADMIN["<b>Admin Service</b><br/>━━━━━━━━━━━━━━━<br/>🛡️ Port: 1003<br/>Administrative operations<br/>for users, orders & products"]
    end

    subgraph Services["<b>🔗 DOWNSTREAM SERVICES</b>"]
        direction LR
        User["👤 User Service<br/><i>User Data</i>"]
        Order["📦 Order Service<br/><i>Order Data</i>"]
        Product["📦 Product Service<br/><i>Product Data</i>"]
        Auth["🔐 Auth Service<br/><i>JWT Issuance</i>"]
    end

    subgraph EventConsumers["<b>📤 EVENT CONSUMERS</b>"]
        direction LR
        Audit["📋 Audit Service<br/><i>Audit Logging</i>"]
    end

    subgraph Infrastructure["<b>⚙️ INFRASTRUCTURE</b>"]
        direction TB
        RabbitMQ[("🐰 RabbitMQ<br/>Message Broker<br/>Port: 5672")]
        Dapr["📡 Dapr Sidecar<br/>HTTP: 3500"]
    end

    %% User flows
    Admin -->|"Uses"| AdminUI
    AdminUI -->|"HTTP/REST"| ADMIN

    %% Service integrations - HTTP
    ADMIN -->|"HTTP GET/PATCH/DELETE<br/>User Admin APIs"| User
    ADMIN -->|"HTTP GET/PUT/DELETE<br/>Order Admin APIs"| Order
    ADMIN -->|"HTTP CRUD<br/>Product Admin APIs"| Product
    Auth -.->|"JWT Public Key<br/>(startup only)"| ADMIN

    %% Event flows - Outbound (Publisher → Broker → Consumers)
    ADMIN -.->|"Publish"| Dapr
    Dapr -.->|"admin.*"| RabbitMQ
    RabbitMQ -.->|"admin.*"| Audit

    %% Styling - Core Service
    classDef core fill:#7c3aed,stroke:#6d28d9,color:#fff,stroke-width:3px,font-weight:bold

    %% Styling - Users
    classDef user fill:#8250df,stroke:#6639ba,color:#fff,stroke-width:2px

    %% Styling - Client Apps
    classDef client fill:#1f6feb,stroke:#1158c7,color:#fff,stroke-width:2px

    %% Styling - Dependent Services
    classDef userSvc fill:#0969da,stroke:#0550ae,color:#fff,stroke-width:2px
    classDef orderSvc fill:#0891b2,stroke:#0e7490,color:#fff,stroke-width:2px
    classDef productSvc fill:#059669,stroke:#047857,color:#fff,stroke-width:2px
    classDef authSvc fill:#dc2626,stroke:#b91c1c,color:#fff,stroke-width:2px

    %% Styling - Event Consumers
    classDef auditSvc fill:#65a30d,stroke:#4d7c0f,color:#fff,stroke-width:2px

    %% Styling - Infrastructure
    classDef broker fill:#f472b6,stroke:#db2777,color:#fff,stroke-width:2px
    classDef messaging fill:#d97706,stroke:#b45309,color:#fff,stroke-width:2px

    %% Apply styles
    class ADMIN core
    class Admin user
    class AdminUI client
    class User userSvc
    class Order orderSvc
    class Product productSvc
    class Auth authSvc
    class Audit auditSvc
    class RabbitMQ broker
    class Dapr messaging
```

#### Diagram Legend

|     Color     | Component           | Description                    |
| :-----------: | ------------------- | ------------------------------ |
| 🟣 **Purple** | Admin Service       | Core service being documented  |
| 🟣 **Violet** | Admin Users         | User actors                    |
|  🔵 **Blue**  | Admin UI / User Svc | Clients and dependent services |
|  🟢 **Teal**  | Product Service     | Product data service           |
|  🔴 **Red**   | Auth Service        | Authentication and security    |
| 🟢 **Green**  | Audit Service       | Logging consumer               |
|  🩷 **Pink**  | RabbitMQ            | Message broker infrastructure  |
| 🟠 **Orange** | Dapr Sidecar        | Messaging sidecar              |

| Arrow Style       | Meaning                            |
| ----------------- | ---------------------------------- |
| **━━━▶** Solid    | Synchronous HTTP request-response  |
| **─ ─ ─▶** Dashed | Asynchronous event-based messaging |

### 2.2 External Interfaces

| System          | Direction | Protocol    | Description                                        |
| --------------- | --------- | ----------- | -------------------------------------------------- |
| Admin UI        | In        | HTTP        | Admin web interface                                |
| User Service    | Out       | HTTP        | Proxies user admin operations                      |
| Order Service   | Out       | HTTP        | Proxies order admin operations                     |
| Product Service | Out       | HTTP        | Proxies product admin operations                   |
| Audit Service   | Out       | Dapr Events | Publishes admin operation events for audit logging |

### 2.3 Dependencies

#### 2.3.1 Upstream Dependencies

| Service      | Dependency Type | Purpose                             |
| ------------ | --------------- | ----------------------------------- |
| Auth Service | JWT             | JWT public key for token validation |

#### 2.3.2 Downstream Services

| Service         | Interface | Purpose                 |
| --------------- | --------- | ----------------------- |
| User Service    | HTTP      | User CRUD operations    |
| Order Service   | HTTP      | Order CRUD operations   |
| Product Service | HTTP      | Product CRUD operations |

#### 2.3.3 Event Consumers

| Consumer      | Interface   | Data Provided              |
| ------------- | ----------- | -------------------------- |
| Audit Service | Dapr Events | All admin operation events |

#### 2.3.4 Infrastructure Dependencies

| Component           | Purpose                | Port/Connection         |
| ------------------- | ---------------------- | ----------------------- |
| Dapr Sidecar        | Pub/sub messaging      | HTTP: 3500, gRPC: 50001 |
| RabbitMQ (via Dapr) | Message broker backend | Abstracted by Dapr      |

---

## 3. API Design

### 3.1 Endpoint Summary

| Method   | Endpoint                                  | Description                    | Auth      |
| -------- | ----------------------------------------- | ------------------------------ | --------- |
| `GET`    | `/health`                                 | Liveness probe                 | None      |
| `GET`    | `/health/ready`                           | Readiness probe                | None      |
| `GET`    | `/health/live`                            | Liveness probe                 | None      |
| `GET`    | `/`                                       | Welcome message                | None      |
| `GET`    | `/admin/users`                            | List all users                 | Admin JWT |
| `GET`    | `/admin/users/:id`                        | Get user by ID                 | Admin JWT |
| `PATCH`  | `/admin/users/:id`                        | Update user                    | Admin JWT |
| `DELETE` | `/admin/users/:id`                        | Delete user                    | Admin JWT |
| `GET`    | `/admin/orders`                           | List all orders                | Admin JWT |
| `GET`    | `/admin/orders/paged`                     | List orders (paginated)        | Admin JWT |
| `GET`    | `/admin/orders/stats`                     | Get order statistics           | Admin JWT |
| `GET`    | `/admin/orders/:id`                       | Get order by ID                | Admin JWT |
| `PUT`    | `/admin/orders/:id/status`                | Update order status            | Admin JWT |
| `DELETE` | `/admin/orders/:id`                       | Delete order                   | Admin JWT |
| `GET`    | `/admin/products`                         | List all products              | Admin JWT |
| `GET`    | `/admin/products/:id`                     | Get product by ID              | Admin JWT |
| `POST`   | `/admin/products`                         | Create product                 | Admin JWT |
| `PUT`    | `/admin/products/:id`                     | Update product                 | Admin JWT |
| `DELETE` | `/admin/products/:id`                     | Delete product                 | Admin JWT |
| `POST`   | `/admin/products/variations`              | Create product with variations | Admin JWT |
| `POST`   | `/admin/products/:id/variations`          | Add variation to product       | Admin JWT |
| `GET`    | `/admin/products/:id/variations`          | List product variations        | Admin JWT |
| `POST`   | `/admin/products/:id/badges`              | Assign badge to product        | Admin JWT |
| `DELETE` | `/admin/products/:id/badges/:badgeId`     | Remove badge from product      | Admin JWT |
| `POST`   | `/admin/products/badges/bulk`             | Bulk assign badge              | Admin JWT |
| `POST`   | `/admin/products/bulk/import`             | Bulk import products           | Admin JWT |
| `GET`    | `/admin/products/bulk/jobs/:jobId`        | Get bulk import status         | Admin JWT |
| `GET`    | `/admin/products/bulk/template`           | Download import template       | Admin JWT |
| `GET`    | `/admin/products/bulk/jobs/:jobId/errors` | Get bulk import errors         | Admin JWT |
| `POST`   | `/admin/products/bulk/images`             | Bulk upload product images     | Admin JWT |

**Authentication Types:**

- **None**: Public endpoints (health checks)
- **Admin JWT**: Admin operations requiring `role: admin` in JWT

### 3.2 Request/Response Specifications

#### 3.2.1 List All Users

**Endpoint:** `GET /admin/users`

**Authentication:** Admin JWT Required

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["customer"],
      "isActive": true,
      "createdAt": "2025-10-24T10:30:00Z"
    }
  ]
}
```

---

#### 3.2.2 Get User by ID

**Endpoint:** `GET /admin/users/:id`

**Authentication:** Admin JWT Required

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["customer"],
    "isActive": true,
    "addresses": [],
    "paymentMethods": [],
    "createdAt": "2025-10-24T10:30:00Z"
  }
}
```

**Error Responses:**

| Status | Code             | Description            |
| ------ | ---------------- | ---------------------- |
| 400    | `INVALID_ID`     | Invalid user ID format |
| 404    | `USER_NOT_FOUND` | User does not exist    |

---

#### 3.2.3 Update User

**Endpoint:** `PATCH /admin/users/:id`

**Authentication:** Admin JWT Required

**Request Body:**

```json
{
  "firstName": "Jonathan",
  "roles": ["admin"],
  "isActive": true
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "firstName": "Jonathan",
    "roles": ["admin"],
    "isActive": true,
    "updatedAt": "2025-10-24T11:00:00Z"
  }
}
```

**Error Responses:**

| Status | Code               | Description            |
| ------ | ------------------ | ---------------------- |
| 400    | `INVALID_ID`       | Invalid user ID format |
| 400    | `INVALID_PAYLOAD`  | Invalid update data    |
| 400    | `INVALID_EMAIL`    | Invalid email format   |
| 400    | `INVALID_PASSWORD` | Invalid password       |
| 400    | `INVALID_ROLES`    | Invalid roles array    |

---

#### 3.2.4 Delete User

**Endpoint:** `DELETE /admin/users/:id`

**Authentication:** Admin JWT Required

**Response (204 No Content):**

No response body.

**Error Responses:**

| Status | Code             | Description               |
| ------ | ---------------- | ------------------------- |
| 400    | `INVALID_ID`     | Invalid user ID format    |
| 403    | `SELF_DELETE`    | Cannot delete own account |
| 404    | `USER_NOT_FOUND` | User does not exist       |

---

#### 3.2.5 Get Order Statistics

**Endpoint:** `GET /admin/orders/stats`

**Authentication:** Admin JWT Required

**Query Parameters:**

| Parameter       | Type    | Required | Default | Description             |
| --------------- | ------- | -------- | ------- | ----------------------- |
| `includeRecent` | boolean | No       | false   | Include recent orders   |
| `recentLimit`   | integer | No       | 10      | Number of recent orders |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "totalOrders": 1500,
    "totalRevenue": 125000.0,
    "averageOrderValue": 83.33,
    "ordersByStatus": {
      "pending": 50,
      "processing": 100,
      "shipped": 300,
      "delivered": 1000,
      "cancelled": 50
    },
    "recentOrders": [
      {
        "orderId": "order-123",
        "userId": "user-456",
        "total": 150.0,
        "status": "processing",
        "createdAt": "2025-10-24T10:30:00Z"
      }
    ]
  }
}
```

### 3.3 Error Response Format

All API errors return a consistent JSON structure:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error description"
}
```

### 3.4 Error Code Reference

| Code               | HTTP Status | Description                          |
| ------------------ | ----------- | ------------------------------------ |
| `UNAUTHORIZED`     | 401         | Missing or invalid JWT token         |
| `FORBIDDEN`        | 403         | Insufficient permissions (non-admin) |
| `INVALID_ID`       | 400         | Invalid MongoDB ObjectId format      |
| `INVALID_PAYLOAD`  | 400         | Invalid request body                 |
| `INVALID_EMAIL`    | 400         | Invalid email format                 |
| `INVALID_PASSWORD` | 400         | Password doesn't meet requirements   |
| `INVALID_ROLES`    | 400         | Invalid roles array                  |
| `INVALID_ISACTIVE` | 400         | Invalid isActive value               |
| `USER_NOT_FOUND`   | 404         | User does not exist                  |
| `ORDER_NOT_FOUND`  | 404         | Order does not exist                 |
| `SELF_DELETE`      | 403         | Cannot delete own admin account      |

### 3.5 Authentication

All admin endpoints require a valid JWT token with `role: admin`:

**Header:** `Authorization: Bearer <jwt_token>`

**JWT Payload Requirements:**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "admin@example.com",
  "roles": ["admin"],
  "iat": 1698150000,
  "exp": 1698153600
}
```

---

## 4. Event Architecture

### 4.1 Event Summary

Admin Service follows a **Publisher-Only** pattern:

- ✅ **Publishes** events for audit logging
- ❌ **Does NOT consume** events

### 4.2 Published Events

| Event                   | Topic                   | Trigger             | Payload                     |
| ----------------------- | ----------------------- | ------------------- | --------------------------- |
| `admin.user.updated`    | `admin.user.updated`    | User update         | actorId, targetId, changes  |
| `admin.user.deleted`    | `admin.user.deleted`    | User deletion       | actorId, targetId           |
| `admin.order.updated`   | `admin.order.updated`   | Order status update | actorId, orderId, status    |
| `admin.order.deleted`   | `admin.order.deleted`   | Order deletion      | actorId, orderId            |
| `admin.product.created` | `admin.product.created` | Product creation    | actorId, productId          |
| `admin.product.updated` | `admin.product.updated` | Product update      | actorId, productId, changes |
| `admin.product.deleted` | `admin.product.deleted` | Product deletion    | actorId, productId          |

**Event Format (CloudEvents 1.0):**

```json
{
  "specversion": "1.0",
  "type": "com.xshopai.admin.user.updated",
  "source": "admin-service",
  "id": "evt-123-abc",
  "time": "2025-10-24T10:30:00Z",
  "datacontenttype": "application/json",
  "data": {
    "actorId": "admin-user-id",
    "targetId": "affected-user-id",
    "changes": {
      "roles": ["admin"],
      "isActive": true
    }
  },
  "metadata": {
    "correlationId": "req-xyz-789",
    "ipAddress": "192.168.1.1"
  }
}
```

### 4.3 Dapr Configuration

#### Event Bus Component

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

---

## 5. Configuration

### 5.1 Environment Variables

| Variable                | Description                          | Default                     | Required |
| ----------------------- | ------------------------------------ | --------------------------- | -------- |
| `NODE_ENV`              | Environment (development/production) | `development`               | No       |
| `PORT`                  | HTTP server port                     | `1003`                      | No       |
| `NAME`                  | Service name                         | `admin-service`             | No       |
| `VERSION`               | Service version                      | `1.0.0`                     | No       |
| `LOG_LEVEL`             | Logging level                        | `info`                      | No       |
| `JWT_SECRET`            | JWT signing secret                   | -                           | Yes      |
| `USER_SERVICE_URL`      | User service base URL                | `http://localhost:8002/api` | Yes      |
| `ORDER_SERVICE_URL`     | Order service base URL               | `http://localhost:8006/api` | Yes      |
| `DAPR_HTTP_PORT`        | Dapr sidecar HTTP port               | `3500`                      | No       |
| `DAPR_GRPC_PORT`        | Dapr sidecar gRPC port               | `50001`                     | No       |
| `DAPR_APP_ID`           | Dapr application ID                  | `admin-service`             | No       |
| `DAPR_PUBSUB_NAME`      | Dapr pub/sub component name          | `pubsub`                    | No       |
| `DAPR_SECRETSTORE_NAME` | Dapr secret store component name     | `secretstore`               | No       |

---

## 6. Deployment

### 6.1 Deployment Targets

| Environment            | Platform             | Configuration                |
| ---------------------- | -------------------- | ---------------------------- |
| Local Development      | Docker Compose       | `docker-compose.yml`         |
| Local Development      | Dapr CLI             | `dapr run` with Dapr sidecar |
| Azure Container Apps   | ACA with Dapr        | Built-in Dapr integration    |
| Azure Kubernetes (AKS) | Kubernetes with Dapr | Dapr sidecar injection       |

---

## 7. Observability

### 7.1 Distributed Tracing

- Correlation IDs generated/propagated for all requests
- Forwarded to downstream services via headers
- Included in all published events

### 7.2 Structured Logging

**Log Format:**

```json
{
  "timestamp": "2025-10-24T10:30:00Z",
  "level": "info",
  "service": "admin-service",
  "correlationId": "req-xyz-789",
  "actorId": "admin-user-id",
  "targetId": "affected-user-id",
  "message": "Admin updating user",
  "operation": "updateUser"
}
```

**Log Levels:**

| Level   | Usage                                |
| ------- | ------------------------------------ |
| `error` | Errors requiring immediate attention |
| `warn`  | Potentially harmful situations       |
| `info`  | General operational events           |
| `debug` | Detailed debugging information       |

### 7.3 Metrics & Alerting

**Health Endpoints:**

| Endpoint        | Purpose                           |
| --------------- | --------------------------------- |
| `/health`       | Basic health check                |
| `/health/ready` | Readiness probe (dependencies OK) |
| `/health/live`  | Liveness probe (process alive)    |

---

## 8. Security

### 8.1 Authentication

- All admin endpoints require valid JWT with `role: admin`
- JWT validated locally using shared secret or public key
- Token forwarded to downstream services for authorization

### 8.2 Authorization

- Role-based access control (RBAC) enforced
- Only `admin` role can access admin endpoints
- Self-deletion prevention for admin accounts

### 8.3 Input Validation

| Validation | Rule                                  |
| ---------- | ------------------------------------- |
| User ID    | Valid MongoDB ObjectId (24 hex chars) |
| Order ID   | Valid MongoDB ObjectId                |
| Email      | Valid email format                    |
| Password   | Minimum 6 characters                  |
| Roles      | Array containing valid roles          |
| isActive   | Boolean value                         |

---
