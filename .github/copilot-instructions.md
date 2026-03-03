# Copilot Instructions — admin-service

## Service Identity

- **Name**: admin-service
- **Purpose**: Administrative operations — user management, role administration, system-wide admin functions
- **Port**: 8003
- **Language**: Node.js 20+ (JavaScript ESM)
- **Framework**: Express 5.1+
- **Database**: No own database — calls user-service via Dapr for user operations
- **Dapr App ID**: `admin-service`

## Architectural Rules

- This service MUST NOT connect to any database.
- This service MUST NOT consume events from pub/sub.
- All user-related operations MUST be delegated to user-service via Dapr service invocation.
- All routes MUST enforce admin role verification.
- All outbound service calls MUST forward the incoming JWT.
- All responses MUST be JSON.
- All events MUST follow CloudEvents 1.0 format.
- If X-Correlation-ID header is missing, generate a UUID.
- Include correlationId in:
  - All logs
  - All error responses
  - All outbound Dapr calls
  - All published events

## Project Structure

```text
admin-service/
├── src/
│   ├── controllers/     # Admin endpoint handlers
│   ├── clients/         # Dapr service invocation clients
│   ├── middlewares/      # Auth, logging, tracing
│   ├── validators/      # Input validation
│   ├── routes/          # Route definitions
│   ├── core/            # Config, logger, errors
│   └── utils/           # Helper functions
├── tests/
│   ├── unit/
│   └── e2e/
├── .dapr/components/
└── package.json
```

## Code Conventions

- **ESM modules** (`import/export`)
- **Express 5.1+** with async error handling
- Structured logging via **Winston**
- Admin-only access: all routes require JWT with `admin` role
- Error handling: custom `ErrorResponse` class
- Correlation IDs propagated via `X-Correlation-ID` header

## Code Generation Priorities

When generating new features:

1. Reuse existing middlewares.
2. Follow existing folder structure.
3. Add validators before controllers.
4. Add unit tests alongside implementation.
5. Never duplicate logic across controllers.

## Security Rules

- JWT MUST be validated before accessing any controller logic.
- Admin role MUST be verified using `role === 'admin'`.
- Never trust client-provided user IDs.
- Validate all request bodies using validators.
- Sanitize all inputs.
- Rate limiting middleware must be applied to all routes.

## Error Handling Contract

All errors MUST follow this JSON structure:

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message",
    "correlationId": "uuid"
  }
}
```

- Never expose stack traces in production.
- Use centralized error middleware only.

## Logging Rules

- Use structured JSON logging only.
- Include:
  - timestamp
  - level
  - serviceName
  - correlationId
  - message
- Never log JWT tokens.
- Never log secrets.

## Dapr Integration

- **Pub/Sub**: Publishes `admin.user.updated`, `admin.user.deleted` events
- **Service Invocation**: Calls `user-service` for user CRUD
- **Ports**: Dapr HTTP 3500, Dapr gRPC 50001

## Event Format Example

```json
{
  "specversion": "1.0",
  "type": "admin.user.updated",
  "source": "admin-service",
  "id": "uuid",
  "time": "ISO timestamp",
  "datacontenttype": "application/json",
  "data": {
    "userId": "uuid",
    "updatedBy": "adminId"
  }
}
```

## Testing Requirements

- All new controllers MUST have unit tests.
- All new routes MUST have e2e tests.
- Use Jest and Supertest.
- Mock Dapr calls in unit tests.
- Do NOT call real user-service in unit tests.

## Non-Goals

- This service is NOT responsible for authentication.
- Authentication (issuing JWTs) is handled by auth-service.
- This service is responsible only for validating and authorizing JWTs.
- This service does NOT manage user passwords.
- This service does NOT store user data.
- This service does NOT consume domain events.

## Environment Variables

```
PORT=8003
NODE_ENV=development
JWT_SECRET=<shared-secret>
USER_SERVICE_URL=http://localhost:8002
USER_SERVICE_SECRET=<shared-service-secret>
DAPR_HTTP_PORT=3500
```

## Common Commands

```bash
npm run dev              # Dev with Dapr
npm test                 # All tests
npm run test:e2e         # End-to-end tests
```
