# Admin Service - Product Requirements Document

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Scope](#2-scope)
3. [User Stories](#3-user-stories)
4. [Functional Requirements](#4-functional-requirements)
5. [Traceability Matrix](#5-traceability-matrix)
6. [Non-Functional Requirements](#6-non-functional-requirements)

---

## 1. Executive Summary

### 1.1 Purpose

The Admin Service is a privileged microservice within the xshopai e-commerce platform responsible for administrative operations across the platform. Following Amazon's admin portal pattern, it serves as an action center for managing users, orders, and system-wide administrative functions.

### 1.2 Business Objectives

| Objective                      | Description                                                        |
| ------------------------------ | ------------------------------------------------------------------ |
| **Centralized Admin Portal**   | Single entry point for all administrative operations               |
| **User Account Management**    | Enable administrators to manage user accounts and permissions      |
| **Order Administration**       | Allow administrators to view and manage orders across the platform |
| **Product Catalog Management** | Enable administrators to manage products, variations, and badges   |
| **Audit & Compliance**         | Publish events for audit trail and compliance requirements         |

### 1.3 Success Metrics

| Metric                       | Target  | Description                                     |
| ---------------------------- | ------- | ----------------------------------------------- |
| API Response Time (p95)      | < 200ms | 95th percentile response time for admin queries |
| Admin Operation Success Rate | > 99%   | Percentage of valid admin operations completed  |
| Service Availability         | 99.9%   | Uptime during business hours                    |
| Audit Event Coverage         | 100%    | All admin operations generate audit events      |

### 1.4 Target Users

| User              | Interaction                                                              |
| ----------------- | ------------------------------------------------------------------------ |
| **Admin Users**   | Manage users, orders, products, and platform administration via Admin UI |
| **Admin UI**      | Web interface consuming admin service APIs                               |
| **Audit Service** | Receives admin operation events for compliance logging                   |

---

## 2. Scope

### 2.1 In Scope

- User management (list, view, update, delete users)
- Role and permission administration
- User status management (activate/deactivate)
- Admin-initiated password changes
- Order management (list, view, update status, delete)
- Order statistics and reporting
- Product management (list, view, create, update, delete products)
- Product variation management (create parent with variations, add variations)
- Product badge management (assign, remove, bulk assign)
- Bulk product operations (import, image upload)
- Event publishing for audit trails
- Authorization enforcement (admin role required)

### 2.2 Out of Scope

- Authentication/login (handled by auth-service)
- User registration (handled by auth-service + user-service)
- User self-service operations (handled by user-service)
- Payment processing (handled by payment-service)
- Order creation (handled by order-service)
- Product data storage (data owned by product-service)
- Inventory management (handled by inventory-service)

---

## 3. User Stories

### 3.1 User Management

**As an** Admin User  
**I want to** view and manage all user accounts  
**So that** I can support customers and maintain platform security

**Acceptance Criteria:**

- [ ] View paginated list of all users
- [ ] View individual user details by ID
- [ ] Update user profiles (admin override)
- [ ] Change user roles and permissions
- [ ] Activate or deactivate user accounts
- [ ] Delete user accounts (with safeguard against self-deletion)
- [ ] All operations require admin JWT authentication

---

### 3.2 Order Management

**As an** Admin User  
**I want to** view and manage all orders  
**So that** I can resolve customer issues and process refunds

**Acceptance Criteria:**

- [ ] View all orders with pagination
- [ ] View individual order details by ID
- [ ] Update order status (processing, shipped, delivered, cancelled)
- [ ] Delete orders (for fraud/test orders)
- [ ] View order statistics (totals, averages, recent orders)
- [ ] All operations require admin JWT authentication

---

### 3.3 Product Management

**As an** Admin User  
**I want to** view and manage all products in the catalog  
**So that** I can maintain accurate product information and pricing

**Acceptance Criteria:**

- [ ] View paginated list of all products
- [ ] View individual product details by ID
- [ ] Create new products with all required fields
- [ ] Update existing products (name, description, price, images, etc.)
- [ ] Delete products (soft delete)
- [ ] Manage product variations (create parent with children, add variations)
- [ ] Assign and remove badges from products
- [ ] Bulk import products from Excel/CSV
- [ ] Bulk upload product images
- [ ] All operations require admin JWT authentication

---

### 3.4 Audit Trail

**As a** Compliance Officer  
**I want to** have all admin operations logged  
**So that** we can track changes for security and compliance

**Acceptance Criteria:**

- [ ] All user management operations publish audit events
- [ ] All order management operations publish audit events
- [ ] All product management operations publish audit events
- [ ] Events include actor ID, target ID, timestamp, and action details
- [ ] Events published via Dapr pub/sub to audit-service

---

## 4. Functional Requirements

### 4.1 List All Users

**Description:**  
The system shall provide an API endpoint for admins to list all users.

**Functional Details:**

| Aspect   | Specification         |
| -------- | --------------------- |
| Endpoint | `GET /admin/users`    |
| Output   | Array of user objects |
| Auth     | Admin JWT required    |

**Acceptance Criteria:**

- [ ] Returns list of all users from user-service
- [ ] Excludes password field from all users
- [ ] Forwards admin JWT to user-service for authorization

**Notes:** Proxies request to user-service admin API.

---

### 4.2 Get User by ID

**Description:**  
The system shall provide an API endpoint to get a specific user by ID.

**Functional Details:**

| Aspect   | Specification          |
| -------- | ---------------------- |
| Endpoint | `GET /admin/users/:id` |
| Output   | Single user object     |
| Auth     | Admin JWT required     |

**Acceptance Criteria:**

- [ ] Validates user ID format (MongoDB ObjectId)
- [ ] Returns 404 if user not found
- [ ] Excludes password field from response

---

### 4.3 Update User

**Description:**  
The system shall provide an API endpoint for admins to update any user.

**Functional Details:**

| Aspect   | Specification            |
| -------- | ------------------------ |
| Endpoint | `PATCH /admin/users/:id` |
| Input    | Partial user object      |
| Output   | Updated user object      |
| Auth     | Admin JWT required       |

**Acceptance Criteria:**

- [ ] Can update profile fields (firstName, lastName, email, phone)
- [ ] Can change roles (customer, admin)
- [ ] Can change isActive status
- [ ] Can change password (admin-initiated)
- [ ] Validates email format if provided
- [ ] Validates password strength if provided
- [ ] Validates roles if provided
- [ ] Publishes `admin.user.updated` event

---

### 4.4 Delete User

**Description:**  
The system shall provide an API endpoint for admins to delete any user.

**Functional Details:**

| Aspect   | Specification             |
| -------- | ------------------------- |
| Endpoint | `DELETE /admin/users/:id` |
| Output   | 204 No Content            |
| Auth     | Admin JWT required        |

**Acceptance Criteria:**

- [ ] Validates user ID format
- [ ] Prevents admin from deleting their own account
- [ ] Returns 403 if attempting self-deletion
- [ ] Returns 404 if user not found
- [ ] Publishes `admin.user.deleted` event

---

### 4.5 List All Orders

**Description:**  
The system shall provide an API endpoint for admins to list all orders.

**Functional Details:**

| Aspect   | Specification          |
| -------- | ---------------------- |
| Endpoint | `GET /admin/orders`    |
| Output   | Array of order objects |
| Auth     | Admin JWT required     |

**Acceptance Criteria:**

- [ ] Returns list of all orders from order-service
- [ ] Forwards admin JWT to order-service for authorization

---

### 4.6 Get Paginated Orders

**Description:**  
The system shall provide an API endpoint for admins to list orders with pagination.

**Functional Details:**

| Aspect     | Specification             |
| ---------- | ------------------------- |
| Endpoint   | `GET /admin/orders/paged` |
| Pagination | Query params: page, limit |
| Auth       | Admin JWT required        |

**Acceptance Criteria:**

- [ ] Returns paginated list of orders
- [ ] Supports page and limit query parameters
- [ ] Returns total count for pagination UI

---

### 4.7 Get Order by ID

**Description:**  
The system shall provide an API endpoint to get a specific order by ID.

**Functional Details:**

| Aspect   | Specification           |
| -------- | ----------------------- |
| Endpoint | `GET /admin/orders/:id` |
| Output   | Single order object     |
| Auth     | Admin JWT required      |

**Acceptance Criteria:**

- [ ] Returns order details from order-service
- [ ] Returns 404 if order not found

---

### 4.8 Update Order Status

**Description:**  
The system shall provide an API endpoint to update order status.

**Functional Details:**

| Aspect   | Specification                  |
| -------- | ------------------------------ |
| Endpoint | `PUT /admin/orders/:id/status` |
| Input    | Status object                  |
| Output   | Updated order object           |
| Auth     | Admin JWT required             |

**Acceptance Criteria:**

- [ ] Updates order status via order-service
- [ ] Validates status transitions
- [ ] Publishes `admin.order.updated` event

---

### 4.9 Delete Order

**Description:**  
The system shall provide an API endpoint to delete an order.

**Functional Details:**

| Aspect   | Specification              |
| -------- | -------------------------- |
| Endpoint | `DELETE /admin/orders/:id` |
| Output   | 204 No Content             |
| Auth     | Admin JWT required         |

**Acceptance Criteria:**

- [ ] Deletes order via order-service
- [ ] Returns 404 if order not found
- [ ] Publishes `admin.order.deleted` event

---

### 4.10 Get Order Statistics

**Description:**  
The system shall provide an API endpoint to get order statistics.

**Functional Details:**

| Aspect   | Specification             |
| -------- | ------------------------- |
| Endpoint | `GET /admin/orders/stats` |
| Output   | Statistics object         |
| Auth     | Admin JWT required        |

**Acceptance Criteria:**

- [ ] Returns order totals and averages
- [ ] Optionally includes recent orders (query param)
- [ ] Configurable recent orders limit

---

### 4.11 List All Products

**Description:**  
The system shall provide an API endpoint for admins to list all products.

**Functional Details:**

| Aspect   | Specification            |
| -------- | ------------------------ |
| Endpoint | `GET /admin/products`    |
| Output   | Array of product objects |
| Auth     | Admin JWT required       |

**Acceptance Criteria:**

- [ ] Returns list of all products from product-service
- [ ] Supports pagination, filtering, and search
- [ ] Forwards admin JWT to product-service for authorization

---

### 4.12 Get Product by ID

**Description:**  
The system shall provide an API endpoint to get a specific product by ID.

**Functional Details:**

| Aspect   | Specification             |
| -------- | ------------------------- |
| Endpoint | `GET /admin/products/:id` |
| Output   | Single product object     |
| Auth     | Admin JWT required        |

**Acceptance Criteria:**

- [ ] Returns product details from product-service
- [ ] Returns 404 if product not found

---

### 4.13 Create Product

**Description:**  
The system shall provide an API endpoint for admins to create new products.

**Functional Details:**

| Aspect   | Specification          |
| -------- | ---------------------- |
| Endpoint | `POST /admin/products` |
| Input    | Product object         |
| Output   | Created product object |
| Auth     | Admin JWT required     |

**Acceptance Criteria:**

- [ ] Creates product via product-service
- [ ] Validates required fields (name, sku, price)
- [ ] Publishes `admin.product.created` event

---

### 4.14 Update Product

**Description:**  
The system shall provide an API endpoint for admins to update existing products.

**Functional Details:**

| Aspect   | Specification             |
| -------- | ------------------------- |
| Endpoint | `PUT /admin/products/:id` |
| Input    | Partial product object    |
| Output   | Updated product object    |
| Auth     | Admin JWT required        |

**Acceptance Criteria:**

- [ ] Updates product via product-service
- [ ] Validates input fields
- [ ] Publishes `admin.product.updated` event

---

### 4.15 Delete Product

**Description:**  
The system shall provide an API endpoint for admins to delete products.

**Functional Details:**

| Aspect   | Specification                |
| -------- | ---------------------------- |
| Endpoint | `DELETE /admin/products/:id` |
| Output   | 204 No Content               |
| Auth     | Admin JWT required           |

**Acceptance Criteria:**

- [ ] Soft-deletes product via product-service
- [ ] Returns 404 if product not found
- [ ] Publishes `admin.product.deleted` event

---

### 4.16 Manage Product Variations

**Description:**  
The system shall provide API endpoints for managing product variations.

**Functional Details:**

| Aspect    | Specification                         |
| --------- | ------------------------------------- |
| Endpoints | `POST /admin/products/variations`     |
|           | `POST /admin/products/:id/variations` |
|           | `GET /admin/products/:id/variations`  |
| Auth      | Admin JWT required                    |

**Acceptance Criteria:**

- [ ] Create parent product with multiple variations
- [ ] Add new variations to existing parent product
- [ ] List all variations for a parent product
- [ ] Proxies to product-service admin endpoints

---

### 4.17 Manage Product Badges

**Description:**  
The system shall provide API endpoints for managing product badges.

**Functional Details:**

| Aspect    | Specification                                |
| --------- | -------------------------------------------- |
| Endpoints | `POST /admin/products/:id/badges`            |
|           | `DELETE /admin/products/:id/badges/:badgeId` |
|           | `POST /admin/products/badges/bulk`           |
| Auth      | Admin JWT required                           |

**Acceptance Criteria:**

- [ ] Assign badge to a product
- [ ] Remove badge from a product
- [ ] Bulk assign badge to multiple products
- [ ] Proxies to product-service admin endpoints

---

### 4.18 Bulk Product Operations

**Description:**  
The system shall provide API endpoints for bulk product operations.

**Functional Details:**

| Aspect    | Specification                                 |
| --------- | --------------------------------------------- |
| Endpoints | `POST /admin/products/bulk/import`            |
|           | `GET /admin/products/bulk/jobs/:jobId`        |
|           | `GET /admin/products/bulk/template`           |
|           | `GET /admin/products/bulk/jobs/:jobId/errors` |
|           | `POST /admin/products/bulk/images`            |
| Auth      | Admin JWT required                            |

**Acceptance Criteria:**

- [ ] Bulk import products from Excel file
- [ ] Check import job status
- [ ] Download import template
- [ ] Download import error report
- [ ] Bulk upload product images via ZIP
- [ ] All operations proxied to product-service

---

### 4.19 Publish Admin Events

**Description:**  
The system shall publish events via Dapr Pub/Sub after admin operations.

**Functional Details:**

| Event                   | Trigger             | Payload                     |
| ----------------------- | ------------------- | --------------------------- |
| `admin.user.updated`    | User update         | actorId, targetId, changes  |
| `admin.user.deleted`    | User deletion       | actorId, targetId           |
| `admin.order.updated`   | Order status update | actorId, orderId, status    |
| `admin.order.deleted`   | Order deletion      | actorId, orderId            |
| `admin.product.created` | Product creation    | actorId, productId          |
| `admin.product.updated` | Product update      | actorId, productId, changes |
| `admin.product.deleted` | Product deletion    | actorId, productId          |

**Acceptance Criteria:**

- [ ] Events published after successful operations
- [ ] Events include actorId (admin who performed action)
- [ ] Events include correlationId for tracing
- [ ] Event publishing failure does not fail the API request (graceful degradation)

---

## 5. Traceability Matrix

> **Purpose:** This matrix provides a single snapshot view linking User Stories to their implementing requirements.

| User Story                    | Story Title        | Requirements                                                                                                                                                                                                                                                            |
| ----------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [3.1](#31-user-management)    | User Management    | [4.1](#41-list-all-users), [4.2](#42-get-user-by-id), [4.3](#43-update-user), [4.4](#44-delete-user)                                                                                                                                                                    |
| [3.2](#32-order-management)   | Order Management   | [4.5](#45-list-all-orders), [4.6](#46-get-paginated-orders), [4.7](#47-get-order-by-id), [4.8](#48-update-order-status), [4.9](#49-delete-order), [4.10](#410-get-order-statistics)                                                                                     |
| [3.3](#33-product-management) | Product Management | [4.11](#411-list-all-products), [4.12](#412-get-product-by-id), [4.13](#413-create-product), [4.14](#414-update-product), [4.15](#415-delete-product), [4.16](#416-manage-product-variations), [4.17](#417-manage-product-badges), [4.18](#418-bulk-product-operations) |
| [3.4](#34-audit-trail)        | Audit Trail        | [4.19](#419-publish-admin-events)                                                                                                                                                                                                                                       |

**Coverage Summary:**

- Total User Stories: 4
- Total Requirements: 19
- Requirements without User Story: 0
- User Stories without Requirements: 0

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Metric                  | Target    | Description                             |
| ----------------------- | --------- | --------------------------------------- |
| API Response Time (p95) | < 200ms   | Admin queries and operations            |
| Throughput              | 100 req/s | Sustained load during normal operations |

### 6.2 Reliability

| Metric                  | Target | Description                               |
| ----------------------- | ------ | ----------------------------------------- |
| Service Availability    | 99.9%  | Uptime during business hours              |
| Admin Operation Success | > 99%  | Valid requests that complete successfully |

### 6.3 Security

| Requirement                                    | Priority |
| ---------------------------------------------- | -------- |
| All endpoints require admin JWT authentication | Critical |
| JWT forwarded to downstream services           | Critical |
| Input validation on all endpoints              | Critical |
| Self-deletion prevention                       | Critical |
| No sensitive data (passwords, tokens) in logs  | High     |
| Audit events for all admin operations          | High     |

### 6.4 Observability

| Requirement                                                         | Priority |
| ------------------------------------------------------------------- | -------- |
| Health check endpoints (`/health`, `/health/ready`, `/health/live`) | Critical |
| Structured JSON logging with correlation IDs                        | High     |
| Log admin operations with actor and target IDs                      | High     |
| Prometheus metrics endpoint (`/metrics`)                            | High     |

---
