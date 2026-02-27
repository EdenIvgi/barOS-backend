# BarOS Backend — Code Review

## Overview

Express.js REST API with MongoDB (via native driver). JWT authentication with httpOnly cookies. Layered architecture: routes → controller → service → model per module.

---

## Application Flow

### Architecture

```
Express (port 3031)
  ├─ Middleware: cookieParser, CORS, express.json (5mb), rate limiting
  ├─ Auth: JWT in httpOnly cookie (baros_token), 7-day expiry
  └─ Modules:
       /api/auth     → login, signup, logout
       /api/item     → CRUD + stock update + stock import
       /api/category → CRUD
       /api/order    → CRUD + status update + active orders
       /api/recipe   → CRUD + seed defaults
       /api/barBook  → get, save, clear (single document)
       /api/user     → list users
       /health       → health check (DB connectivity)
```

### Layer Structure (per module)

```
routes.js        — defines endpoints, applies middleware (requireAuth, validate)
controller.js    — extracts request data, calls service, sends response
service.js       — business logic (or passthrough), serialization
model.js         — MongoDB queries (find, insert, update, delete)
```

### Database Collections

```
MongoDB (bandit_db)
  ├─ user        — { username, password (bcrypt), fullname, createdAt }
  ├─ items       — { name, nameEn, category, categoryId, supplier, price, stockQuantity, ... }
  ├─ category    — { name, nameEn, icon, order, isActive }
  ├─ order       — { items[], supplier, status, type, totalAmount, createdAt }
  ├─ recipe      — { title, ingredients[], instructions[], createdAt }
  └─ barBook     — { slug: "default", checklists, dailyTasks, stockTable }
```

### Key Flows

1. **Auth**: `POST /api/auth/login` → bcrypt compare → sign JWT → set cookie → return user (without password)
2. **Stock import**: `POST /api/item/stock/import` → receives rows from Excel → tokenizes item names → fuzzy matches (Levenshtein + Jaccard, threshold 0.72) → dry-run report or bulk update
3. **Orders**: `POST /api/order` → validates items array → calculates totalAmount → inserts document → returns with `_id`
4. **Bar Book**: Single document pattern (slug: "default"). `PUT /api/barBook` replaces the entire content.

---

## Findings & Improvement Suggestions

### Critical — Security

| # | Issue | File | Suggestion |
|---|-------|------|------------|
| 1 | **Database credentials hardcoded** — MongoDB Atlas username and password visible in `config/dev.js`, `config/prod.js`, `config/db.config.js`. | `config/dev.js`, `config/prod.js`, `config/db.config.js` | Move to environment variables immediately. Use `dotenv`. Add `.env` to `.gitignore`. Add `.env.example` with placeholder values. **This is the #1 priority.** |
| 2 | **JWT secret has a hardcoded fallback** — `'baros_dev_secret_change_in_production'` is used if `JWT_SECRET` env var is missing. | `middleware/auth.middleware.js` | In production, fail loudly if `JWT_SECRET` is not set. Never use a fallback. |
| 3 | **No authorization layer** — any authenticated user can delete items, import stock, manage orders, clear bar book. | All `requireAuth` routes | Add role-based middleware (`requireAdmin`, `requireManager`). Store role in user document and JWT payload. |
| 4 | **`GET /api/user` is unprotected** — anyone (no auth) can list all users. | `api/user/user.routes.js` | Add `requireAuth` middleware. Consider `requireAdmin`. |
| 5 | **`GET /api/recipe/seed` is unprotected** — anyone can trigger recipe seeding. | `api/recipe/recipe.routes.js` | Protect or remove from production. |
| 6 | **No input sanitization** — user input goes directly into MongoDB queries. Potential NoSQL injection. | All models | Use `mongo-sanitize` or manually strip `$` keys from user input. |

### High — Performance & Reliability

| # | Issue | File | Suggestion |
|---|-------|------|------------|
| 7 | **N+1 query in `itemModel.getAll()`** — for each item, a separate `findOne` is executed against the `category` collection. With 100 items, that's 101 queries per request. | `api/item/item.model.js:73-113` | Fetch all categories once, build a `Map<id, category>`, populate in-memory. |
| 8 | **Category dual-field confusion** — items store both `category` (string) and `categoryId` (ObjectId). The model tries ObjectId first, then name. `create()` and `update()` have complex fallback logic. | `api/item/item.model.js` | Standardize on one field. Either always store `categoryId` (ObjectId) and populate, or store an embedded category object. |
| 9 | **`ensureDefaultRecipes()` runs on every `getAll()`** — each time the recipes page loads, it checks if default recipes exist. | `api/recipe/recipe.model.js:78` | Run once on server startup, or use the dedicated seed endpoint. |
| 10 | **Service layer is mostly passthrough** — e.g., `order.service.js` just wraps each model call with try/catch/console.error. No business logic added. | `api/order/order.service.js`, `api/category/category.service.js` | Add meaningful business logic (validation, enrichment) at the service layer, or simplify by calling models directly from controllers. |

### Medium — Code Quality

| # | Issue | File | Suggestion |
|---|-------|------|------------|
| 11 | **`db.config.js` is unused** — config is loaded from `config/index.js` → `dev.js` / `prod.js`. This file creates confusion. | `config/db.config.js` | Delete it. |
| 12 | **Serialization (ObjectId → string) is done per-service** — each service has its own `serialize()` / `serializeItem()` / `serializeCategory()` function doing the same thing. | Various `service.js` files | Extract a shared `serialize(doc)` utility. |
| 13 | **`order.model.js` has Hebrew string `'ללא ספק'`** in query logic. | `api/order/order.model.js:29` | Use a constant or move this logic to the frontend. The backend should not contain display strings. |
| 14 | **No request logging middleware** — errors are logged but normal requests are not. | `server.js` | Add a simple request logger (e.g., `morgan`) for debugging and monitoring. |
| 15 | **Logger is just console wrappers** — no log levels, no file output, no structured format. | `services/logger.service.js` | Fine for development. For production, use `winston` or `pino`. |

### Low — Infrastructure

| # | Issue | File | Suggestion |
|---|-------|------|------------|
| 16 | **No `.env` support** — all config is hardcoded in JS files. | `config/` | Add `dotenv` dependency. Create `.env` for local dev, `.env.example` for repo. |
| 17 | **No tests** — no unit tests, no integration tests. | Entire codebase | Add tests for critical flows: auth (login, token verification), stock import (fuzzy matching), order creation. |
| 18 | **No graceful shutdown** — server doesn't close MongoDB connection on `SIGTERM`. | `server.js` | Add `process.on('SIGTERM', ...)` handler that closes the DB connection and stops the server. |
| 19 | **Rate limiter on auth is generous** — 20 login attempts per 15 minutes. | `server.js` | Consider lowering to 10 attempts per 15 minutes to better prevent brute force. |
| 20 | **No CORS origin from env** — allowed origins are hardcoded localhost variants only. | `server.js:29-38` | Add production domain from env var (`CORS_ORIGIN`). |

---

## Summary

**What's done well:**
- Clean, consistent layered architecture (routes → controller → service → model)
- Centralized error handler with proper HTTP status codes
- Smart stock import with fuzzy name matching (Levenshtein + Jaccard scoring)
- HttpOnly cookie-based JWT auth (secure pattern)
- Validation middleware (reusable schema-based)
- Rate limiting on auth and API endpoints
- Health check endpoint with DB status

**Top 3 priorities:**
1. Remove hardcoded database credentials — move to `.env`
2. Fix N+1 category query in `itemModel.getAll()`
3. Add authorization (role-based access control)
