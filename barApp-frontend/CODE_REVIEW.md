# BarOS Frontend — Code Review

## Overview

React SPA built with Vite, Redux Toolkit, React Router, and i18next (Hebrew + English). Communicates with the backend via Axios through a Vite dev proxy (`/api` → `localhost:3031`).

---

## Application Flow

### Architecture

```
React (Vite, port 5173)
  ├─ Router (React Router v6)
  ├─ State (Redux Toolkit — slices + actions)
  ├─ Services (Axios wrappers per entity)
  └─ i18next (Hebrew default, English toggle)
```

### Page Structure

```
App.jsx
  ├─ Sidebar (navigation, hover-expand)
  ├─ AppHeader (login/logout, language toggle, cart icon)
  └─ Routes:
       /                  → HomePage (dashboard, stats, charts, daily task)
       /products          → MenuPage (product catalog, search, filters, pagination)
       /products/:itemId  → ItemDetails
       /order             → OrderPage (shopping cart)
       /orders            → OrdersListPage (date × supplier grid, PDF download)
       /items-management  → ItemsManagementPage (CRUD, filters, Excel import, order creation)
       /bar-book          → BarBookPage (checklists, daily tasks, stock table, recipes)
       /recipes           → BarBookPage (same component, recipes tab)
       /user              → UserDetails (profile)
       /about             → About (info + map)
```

### State Management (Redux)

```
store
  ├─ userModule    → loggedInUser, users
  ├─ itemModule    → items[], filterBy, maxPage, flag
  ├─ orderModule   → orders[], cart[], flag
  ├─ categoryModule → categories[], flag
  ├─ recipeModule  → recipes[], flag
  └─ reviewModule  → reviews[]
```

**Action pattern**: actions dispatch directly to `store` (not using thunks), calling service → dispatching slice actions.

### Key Data Flows

1. **Auth**: `LoginForm` → `user.actions.login()` → `POST /api/auth/login` → stores user in `sessionStorage` + Redux
2. **Items**: `loadItems()` → `GET /api/item` → Redux `setItems()` → components read from store
3. **Cart**: `addToCart()` → Redux + `localStorage` persistence. `checkout()` → groups by supplier → `POST /api/order` per group
4. **Excel import**: File input → `xlsx` parses client-side → `POST /api/item/stock/import` (dry run) → user confirms → second call (apply)
5. **PDF**: `html2canvas` renders HTML to canvas → `jsPDF` adds as image, scales to fit single A4 page

---

## Findings & Improvement Suggestions

### High — Bugs & Reliability

| # | Issue | File | Suggestion |
|---|-------|------|------------|
| 1 | **Login/signup swallow errors** — `user.service.js` catches and returns `undefined`. The caller dispatches `setUser(undefined)` into Redux, leading to broken state. | `services/user.service.js:23-25, 33-35` | Remove the try/catch, or re-throw the error. Let `user.actions.js` handle the error. |
| 2 | **`getLoggedInUser()` can crash** — `JSON.parse()` on corrupted sessionStorage will throw | `services/user.service.js:57` | Wrap in try/catch, return `null` on failure. |
| 3 | **Race condition in `loadItems`** — multiple calls can overwrite each other. The `setTimeout(..., 350)` for `setIsLoading(false)` makes it worse. | `store/actions/item.actions.js` | Use AbortController or a request ID. Remove the artificial delay. |
| 4 | **`ItemsManagementPage` is 1,090 lines** — handles item CRUD, filters, Excel import modal, create-order modal, inline editing, and the table rendering all in one component. | `pages/ItemsManagementPage.jsx` | Break into: `ItemFilters`, `ImportStockModal`, `CreateOrderModal`, `ItemForm`, `ItemsTable`. |
| 5 | **Order `save()` sends supplier as both body AND query param** — redundant, backend only reads from body. | `services/order.service.js:26-37` | Remove the query param logic. Send supplier only in the request body. |

### Medium — Code Quality

| # | Issue | File | Suggestion |
|---|-------|------|------------|
| 6 | **Inconsistent error handling across services** — `user.service.js` swallows errors, `item.service.js` throws, `order.service.js` throws. | All `services/*.js` | Standardize: services should always throw. Let actions/components handle errors. |
| 7 | **Hebrew strings hardcoded alongside i18n** — `NO_SUPPLIER = 'ללא ספק'` in `order.actions.js` and `ItemsManagementPage.jsx`. | `order.actions.js`, `ItemsManagementPage.jsx` | Use `t('noSupplier')` consistently. |
| 8 | **Unused code** — `ReviewIndex` page exists but has no route. `loadCategories` import is commented out. `ReviewEdit`, `ReviewList`, `ReviewPreview` components exist but are mostly unused. | Various | Remove dead code and unused components. |
| 9 | **`package.json` name is `mister-toy-frontend`** — leftover from template. | `package.json` | Rename to `baros-frontend`. |
| 10 | **`localData.js` initializes demo data** — loads sample items into localStorage. Purpose unclear in production context. | `services/localData.js` | Remove or gate behind a dev-only flag. |

### Low — Performance & UX

| # | Issue | File | Suggestion |
|---|-------|------|------------|
| 11 | **No debounce on search input** — every keystroke triggers a state update and re-render. | `cmps/ItemSearch.jsx` → `pages/MenuPage.jsx` | Add a 300ms debounce. |
| 12 | **`loadItems()` and `loadOrders()` called from multiple pages independently** — HomePage, OrdersListPage, and ItemsManagementPage all fetch the same data from scratch. | Various pages | Add a staleness check (e.g., timestamp) to avoid redundant API calls. |
| 13 | **No loading indicators on delete/save actions** — user gets no feedback until success/error message. | `ItemsManagementPage.jsx` | Add loading states or optimistic UI. |
| 14 | **PDF generates HTML as a raster image** — text is not selectable, quality depends on screen DPI. | `services/orderPdf.service.js` | Consider `@react-pdf/renderer` for native PDF with real text. The current approach is a Hebrew-support workaround. |
| 15 | **No client-side route guards** — unauthenticated users can navigate to `/items-management` and see the page (API calls will fail with 401). | `App.jsx` routes | Add a `ProtectedRoute` wrapper that redirects to login. |

---

## Summary

**What's done well:**
- Clean Redux Toolkit usage (slices + standalone action functions)
- Full i18n coverage in Hebrew and English
- Smart Excel import with dry-run preview
- HttpOnly cookie auth (no token in localStorage)
- Cart persistence via localStorage
- Responsive sidebar navigation

**Top 3 priorities:**
1. Fix error swallowing in `user.service.js` (causes broken auth state)
2. Break down `ItemsManagementPage` into sub-components
3. Add client-side route protection for authenticated pages
