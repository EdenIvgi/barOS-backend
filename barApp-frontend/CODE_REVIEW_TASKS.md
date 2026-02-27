# Code Review — Tasks to Improve

> Generated from code review of all modified files.
> Check off tasks as they are completed.

---

## 🔴 Critical Bugs

- [x] **`order.service.js`** — `String(null).trim()` creates a supplier named `"null"`.
  Replace with `order.supplier?.toString().trim() ?? ''`

- [x] **`item.actions.js`** — Staleness cache ignores filter changes.
  `loadItems()` returns stale cached data when the filter changes (e.g., searching "vodka" then "whiskey" returns vodka results).
  Fix: compare current filter against cached filter before returning early.

- [x] **`order.actions.js`** — Cart item `supplier` field is dropped during checkout mapping (~line 135-141).
  The `supplier` property is not included in the mapped order item, causing incomplete order data.

---

## 🟠 High Priority

- [ ] **`ItemsManagementPage.jsx`** — 756-line mega-component, split into:
  - `ItemTable.jsx` — table display and inline editing
  - `ItemFormModal.jsx` — add/edit form
  - `useItemFilters.js` — custom hook for filtering logic
  - `useExcelImport.js` — custom hook for Excel parsing logic

- [ ] **`item.actions.js`** — Staleness check logic is duplicated across 3 action files.
  Extract to a shared `createStalenessGuard(staleMs)` utility.

- [ ] **`category.actions.js`** — Missing staleness cache.
  Categories are fetched on every component mount. Add a `STALE_MS` check like `item.actions.js`.

- [ ] **`order.actions.js`** — No transaction semantics in `checkout()`.
  If orders are created but the subsequent `loadOrders()` fails, the user gets no feedback on whether checkout succeeded.
  Add a fallback success message before the reload.

- [ ] **`App.jsx`** — No `<ErrorBoundary>` around `<Routes>`.
  Any uncaught error in a page component crashes the entire app.
  Wrap routes in an ErrorBoundary component.

---

## 🟡 Medium Priority

- [ ] **`RecipesPage.jsx`** — ~8 hardcoded Hebrew strings (page title, button labels, delete confirm message).
  Replace all with `t('key')` calls and add keys to `i18.js`.

- [ ] **`HomePage.jsx`** — Date comparison logic repeated 4 times.
  Extract `isSameDay(dateA, dateB)` helper function.

- [ ] **`HomePage.jsx`** — Silent failure on barBook service fetch.
  The `.catch(() => setBarBookDailyTasks([]))` swallows the error with no user notification.
  Show a toast error message.

- [ ] **`ItemSearch.jsx`** — Missing `clearTimeout` on component unmount.
  The debounce timer is not cleared when the component unmounts — memory leak.
  Add `useEffect(() => () => clearTimeout(debounceRef.current), [])`.

- [ ] **`OrdersListPage.jsx`** — Fragile date formatting with string split.
  `formatDate()` splits a date string manually. Use `toLocaleDateString()` instead.

- [ ] **`OrdersListPage.jsx`** — No unsaved-changes warning on navigation.
  Users can navigate away while editing an order and lose all changes without any warning.

- [ ] **`order.actions.js`** — `loadOrders()` called after error without checking `isLoading`.
  Both `updateOrder` and `removeOrder` error handlers call `loadOrders()` — could trigger double concurrent fetches.

- [ ] **`i18.js`** — Language-change listener is never removed.
  `i18n.on('languageChanged', ...)` accumulates on every hot reload in dev.
  Store the unsubscribe function and call it on cleanup.

- [ ] **`i18.js`** — 440-line single-file translation config.
  Split into `src/locales/he.json` and `src/locales/en.json` and import them dynamically.

---

## 🔵 Low Priority

- [ ] **`AppHeader.jsx`** — Logout button has no loading state during async logout.
  Add a spinner or disable the button while logout is in progress.

- [ ] **`RecipesPage.jsx`** — `getRecipeSchema()` and `getInitialValues()` are recreated on every render.
  Wrap in `useMemo` to avoid unnecessary allocations.

- [ ] **`RecipesPage.jsx`** — No user-facing feedback on recipe save/delete error.
  `catch` block only logs to console. Show a toast with `showErrorMsg(t('recipeSaveError'))`.

- [ ] **`OrdersListPage.jsx`** — `getOrderSupplier()` duplicated across multiple files.
  Move to a shared location (e.g., `services/supplier.helpers.js` or `store/helpers/`).

- [ ] **`ItemsManagementPage.jsx`** — Hardcoded Hebrew strings in Excel import parser (~lines 293-311).
  Move to i18n keys.

- [ ] **`HomePage.jsx`** — Magic numbers `6` (low-stock limit) and `5` (recent orders limit).
  Extract to named constants: `LOW_STOCK_DISPLAY_LIMIT` and `RECENT_ORDERS_DISPLAY_LIMIT`.

- [ ] **`RecipesPage.jsx`** — Array index used as React `key` in ingredient/step lists.
  Use `key={item + i}` or generate stable IDs to avoid stale renders on reorder.

- [ ] **All components** — No PropTypes or TypeScript type checking.
  Consider adding PropTypes to at least the shared/reusable components (`ItemSearch`, `AppHeader`).
