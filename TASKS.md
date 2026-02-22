# BarOS — Task List (Code Review Fixes)

> Generated from CODE_REVIEW findings (frontend + backend).
> Tasks are ordered by priority: Critical → High → Medium → Low.
> Mark tasks with `[x]` when completed.

---

## Critical — Security (Backend)

- [x] **#1** — Move database credentials to `.env` file ✅
  - Installed `dotenv` in backend
  - Created `.env` with `DB_URL`, `DB_NAME`, `JWT_SECRET`
  - Created `.env.example` with placeholder values
  - Updated `config/dev.js` and `config/prod.js` to read from `process.env` only
  - Added `.env` to `.gitignore`
  - Deleted unused `config/db.config.js`

- [x] **#2** — Remove hardcoded JWT secret fallback ✅
  - In production, throws error if `JWT_SECRET` is not set
  - Fallback kept only for `NODE_ENV !== 'production'`

- [x] **#3** — Protect unprotected endpoints ✅
  - Added `requireAuth` to `GET /api/user`
  - Added `requireAuth` to `GET /api/recipe/seed`

- [x] **#4** — Add input sanitization ✅
  - Installed `mongo-sanitize`
  - Added sanitize middleware that strips `$` keys from `req.body`, `req.query`, `req.params`

---

## High — Bugs & Reliability

- [x] **#5** — Fix login/signup error swallowing (Frontend) ✅
  - Removed try/catch in `user.service.js` `login()`, `signup()`, `logout()`, `getUsers()`
  - Errors now propagate to `user.actions.js`

- [x] **#6** — Fix `getLoggedInUser()` crash on corrupted storage (Frontend) ✅
  - Wrapped `JSON.parse(sessionStorage.getItem(...))` in try/catch
  - Returns `null` on failure

- [x] **#7** — Fix race condition in `loadItems` (Frontend) ✅
  - Removed `setTimeout(..., 350)` delay for `setIsLoading(false)` in `item.actions.js`, `category.actions.js`, `recipe.actions.js`

- [x] **#8** — Break down `ItemsManagementPage` (Frontend) ✅
  - Extracted `ItemFilters` component (`src/cmps/ItemFilters.jsx`)
  - Extracted `ImportStockModal` component (`src/cmps/ImportStockModal.jsx`)
  - Extracted `CreateOrderModal` component (`src/cmps/CreateOrderModal.jsx`)
  - Extracted `ItemForm` component (`src/cmps/ItemForm.jsx`)
  - Table kept inline (simple enough), page reduced from 1,090 → 757 lines

- [x] **#9** — Fix N+1 category query (Backend) ✅
  - `getAll()` now fetches all categories once with `find({})`
  - Builds `Map<idString, category>` + `Map<name, category>` in-memory
  - Populates each item synchronously from the Map — zero extra DB calls

- [x] **#10** — Remove duplicate supplier in order save (Frontend) ✅
  - Removed query param logic from `order.service.js` `save()`
  - Supplier sent only in request body

---

## Medium — Code Quality

- [x] **#11** — Standardize error handling across frontend services ✅
  - All services now throw errors (not swallow them)
  - Actions layer handles errors (dispatch error state, show message)
  - Verified: `user.service.js`, `order.service.js`, `item.service.js`, `category.service.js`, `recipe.service.js`, `barBook.service.js`

- [x] **#12** — Replace hardcoded Hebrew strings with i18n keys ✅
  - Created `src/services/constants.js` with `NO_SUPPLIER_KEY`
  - Frontend: replaced Hebrew in `order.actions.js`, `ItemsManagementPage.jsx`, `OrdersGrowthBySupplierChart.jsx`, `OrdersListPage.jsx`, `HomePage.jsx`, `RecipesPage.jsx`, `BarBookPage.jsx`, `orderPdf.service.js`
  - Backend: replaced `'ללא ספק'` with `NO_SUPPLIER_KEY` in `order.model.js`
  - Added all new translation keys to `i18.js` (Hebrew + English)

- [x] **#13** — Remove dead code and unused components (Frontend) ✅
  - Deleted `ReviewIndex.jsx`, `ReviewEdit.jsx`, `ReviewList.jsx`, `ReviewPreview.jsx`
  - Deleted `review.service.js`, `review.actions.js`, `review.slice.js`
  - Deleted 3 Review SCSS files
  - Deleted `localData.js`
  - Cleaned imports from `store.js`, `App.jsx`, `main.scss`
  - Simplified `UserDetails.jsx`

- [x] **#14** — Fix `package.json` project name (Frontend) ✅
  - Renamed from `mister-toy-frontend` to `baros-frontend`

- [x] **#15** — Standardize category field in items (Backend) ✅
  - Extracted `_resolveCategory`, `_embedCategory`, `_populateCategory` helpers
  - Removed duplicated category lookup logic from `getAll`, `getById`, `create`

- [x] **#16** — Extract shared serialization utility (Backend) ✅
  - Created `services/serialize.service.js` with `serializeDoc()` function
  - Replaced `serializeItem()`, `serializeCategory()`, `serialize()` in all services

- [x] **#17** — Stop running `ensureDefaultRecipes()` on every query (Backend) ✅
  - Moved seed logic to server startup in `server.js`
  - Removed call from `recipeModel.getAll()`

- [x] **#18** — Delete unused `db.config.js` (Backend) ✅
  - File deleted

---

## Low — Performance, UX & Infrastructure

- [x] **#19** — Add debounce to search input (Frontend) ✅
  - Added 300ms debounce on `ItemSearch` onChange using `useRef`/`useCallback`
  - Clear button cancels pending debounce and fires immediately

- [x] **#20** — Add staleness check for data loading (Frontend) ✅
  - Added 30-second staleness check to `loadItems` and `loadOrders`
  - Skips API call if data was loaded recently; supports `force` parameter to bypass

- [x] **#21** — Add loading indicators on delete/save (Frontend) ✅
  - Added `isSaving` state to `ItemsManagementPage`
  - Save button shows loading text and is disabled during save/delete operations
  - Delete buttons are disabled during operations

- [x] **#22** — Add client-side route guards (Frontend) ✅
  - Created `ProtectedRoute` component that checks `loggedInUser`
  - Redirects to `/` if not authenticated
  - Protected routes: `/user`, `/order`, `/orders`, `/items-management`, `/bar-book`, `/recipes`

- [x] **#23** — Add authorization / role-based access (Backend) ✅
  - Added `role` field to user creation (default: `bartender`, options: `admin`, `manager`, `bartender`)
  - Role included in JWT payload
  - Created `requireRole`, `requireAdmin`, `requireManager` middleware
  - Applied: `requireManager` to delete item, import stock, clear bar book, delete order
  - Applied: `requireAdmin` to list users

- [x] **#24** — Add request logging middleware (Backend) ✅
  - Installed `morgan`
  - Uses `dev` format in development, `combined` in production

- [x] **#25** — Add graceful shutdown (Backend) ✅
  - Handles `SIGTERM` and `SIGINT` signals
  - Closes MongoDB connection and stops server
  - 5-second forced shutdown timeout as safety net

- [x] **#26** — Add CORS origin from environment variable (Backend) ✅
  - Reads `CORS_ORIGIN` from env (supports comma-separated list)
  - Merges with existing localhost dev origins

- [x] **#27** — Lower auth rate limit (Backend) ✅
  - Reduced from 20 to 10 attempts per 15-minute window

- [ ] **#28** — Add tests (Both)
  - Backend: auth flow, stock import fuzzy matching, order creation
  - Frontend: user service error handling, cart actions
  - New files: `tests/` directories

---

## Progress

| Priority | Total | Done |
|----------|-------|------|
| Critical | 4     | 4    |
| High     | 6     | 6    |
| Medium   | 8     | 8    |
| Low      | 10    | 9    |
| **Total** | **28** | **27** |
