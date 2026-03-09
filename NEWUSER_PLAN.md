# New User Support — Implementation & Verification

## Architecture Overview

### Database Structure

**Master DB (`barapp_master`):**
- `user` collection — all users across all companies (source of truth for auth/login, contains password hashes)

**Per-company DB (e.g. `bandit_bar_db`):**
- `user` — team members for this company (no passwords, for team management)
- `category` — product categories
- `item` — products/inventory
- `order` — stock orders
- `barBook` — single document: checklists, daily tasks, stock table, recipes

### Signup Flow

1. User fills form: fullname, username, password, companyName
2. Backend sanitizes company name: `"Bandit Bar"` → slug `bandit_bar`, DB name `bandit_bar_db`
3. Stores `companyDisplayName` (original: "Bandit Bar") + `companyName` (slug: "bandit_bar")
4. First user for a given `dbName` = **admin**, subsequent users = **bartender**
5. User inserted into master `barapp_master.user` (with password hash)
6. User also inserted into company DB `bandit_bar_db.user` (no password)
7. JWT token includes: `_id`, `username`, `role`, `dbName`, `companyName`, `companyDisplayName`

### Company Name Display

- **Header:** Shows `companyDisplayName` next to "BarOS" logo when logged in
- **Profile page:** Shows `companyDisplayName` with fallback to slug for legacy users

---

## Verification Checklist

### Step 1: Create a new user
- [ ] Open Landing Page
- [ ] Fill Signup form:
  - Full Name: "Test User"
  - Username: "testuser123"
  - Password: "password123"
  - Company Name: "My Bar"
- [ ] Click Sign Up
- [ ] Verify redirect to /home

### Step 2: Verify database was created
```bash
mongosh

show databases
# Expect: "my_bar_db"

use my_bar_db
show collections
# Expect: user (created on signup)

db.user.find()
# Expect: 1 user document with { username: "testuser123", role: "admin", fullname: "Test User", companyDisplayName: "My Bar" }
# No password field in this collection
```

### Step 3: Verify company name display
- [ ] **Header** — "My Bar" shown next to "BarOS" logo
- [ ] **Profile page** (`/user`) — Company row shows "My Bar" (not "my_bar")

### Step 4: Check all pages with empty data
- [ ] **HomePage** — Stats show `0`, chart shows "no data", no orders/alerts sections
- [ ] **Items Management** — "No products" message + "Add first product" button
- [ ] **Bar Book** — "Bar Book Empty" + "Initialize" button
- [ ] **Orders List** — "No orders" message

### Step 5: Create first product
- [ ] Click "Add first product" in Items Management
- [ ] Fill form: Name, Category (type freely), Price, Stock
- [ ] Click Save
- [ ] Verify product appears in list

### Step 6: Test bar book
- [ ] Click "Initialize" in Bar Book
- [ ] Verify all tabs work (Recipes, Checklists, Stock, Daily)
- [ ] Add content and save

### Step 7: Test order creation
- [ ] Add products with quantities
- [ ] Click "Create Order"
- [ ] Verify order was created

### Step 8: Test second user (bartender)
- [ ] Log out
- [ ] Sign up with same company name "My Bar"
- [ ] Verify role = bartender (not admin)
- [ ] Verify they see the same company data

---

## Troubleshooting

### Database not created
- Check server logs for errors during signup
- Verify MongoDB is running and accessible
- The company DB is auto-created by MongoDB on first insert (user collection insert during signup)

### Company name shows as slug
- For new users: `companyDisplayName` should be in the JWT token
- For legacy users: falls back to `companyName` slug or `dbName` with `_db` stripped

### "Undefined database" error
- The `dbName` comes from the JWT token, set during login/signup
- `auth.middleware.js` extracts it as `req.userDbName`
- All per-company API calls use `req.userDbName` to route to the correct DB
