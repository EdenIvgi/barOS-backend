# barApp Security Fix Implementation Plan

**Status:** In Progress  
**Start Date:** March 10, 2026  
**Target Completion:** March 14, 2026

---

## Priority Levels

### 🔴 CRITICAL (Fix Immediately - Today)
1. **Require JWT_SECRET in all environments** 
2. **Add Helmet.js for security headers**
3. **Enforce HTTPS redirect in production**

### 🟠 HIGH (Fix This Week)
4. **Increase password minimum to 12 characters**
5. **Move user data from sessionStorage (XSS protection)**
6. **Add Content Security Policy (CSP)**
7. **Fix error message exposure**
8. **Reduce rate limiting to prevent abuse**

### 🟡 MEDIUM (Fix Next Week)
9. **Add CSRF protection with csurf**
10. **Validate translate endpoint input**
11. **Add missing authorization checks**
12. **Encrypt localStorage cart data**
13. **Add token expiration check on client**
14. **Sanitize user data in API responses**

### 🔵 LOW (Fix When Convenient)
15. **Reduce JSON payload limit to 1MB**
16. **Implement API versioning (/api/v1/)**
17. **Clear only specific sessionStorage on 401**
18. **Add request logging and monitoring**

---

## Implementation Steps

### PHASE 1: CRITICAL SECURITY FIXES (TODAY)

#### Step 1.1: Fix JWT Secret Requirement
**Files:** `barApp-backend/middleware/auth.middleware.js`
- Make JWT_SECRET required in all environments
- Remove hardcoded default secret
- Status: ⬜ TODO

#### Step 1.2: Install and Configure Helmet.js
**Files:** `barApp-backend/server.js`
- Install: `npm install helmet`
- Add helmet middleware
- Configure security headers
- Status: ⬜ TODO

#### Step 1.3: Enforce HTTPS in Production
**Files:** `barApp-backend/server.js`
- Add middleware to redirect HTTP → HTTPS
- Add HSTS header
- Status: ⬜ TODO

---

### PHASE 2: HIGH PRIORITY FIXES (THIS WEEK)

#### Step 2.1: Increase Password Minimum Length
**Files:** `barApp-backend/api/auth/auth.routes.js`, `barApp-backend/middleware/validate.middleware.js`
- Change password minLength from 4 to 12
- Add complexity validation
- Status: ⬜ TODO

#### Step 2.2: Fix XSS Risk - User Data in SessionStorage
**Files:** 
- `barApp-frontend/src/services/user.service.js`
- `barApp-frontend/src/store/slices/user.slice.js`
- Store only non-sensitive user metadata
- Keep token in httpOnly cookie only
- Status: ⬜ TODO

#### Step 2.3: Add Content Security Policy
**Files:** `barApp-backend/server.js`
- Add CSP headers via helmet
- Configure for React app
- Status: ⬜ TODO

#### Step 2.4: Fix Error Message Exposure
**Files:** `barApp-backend/middleware/error.middleware.js`
- Remove stack traces from API responses
- Log to server only
- Status: ⬜ TODO

#### Step 2.5: Reduce API Rate Limits
**Files:** `barApp-backend/server.js`
- Change from 500 to 100 requests per 15 minutes
- Add stricter limits for auth endpoints
- Status: ⬜ TODO

---

### PHASE 3: MEDIUM PRIORITY FIXES (NEXT WEEK)

#### Step 3.1: Add CSRF Protection
**Files:** `barApp-backend/server.js`, `barApp-backend/middleware/`
- Install: `npm install csurf`
- Add CSRF middleware
- Update API calls on frontend
- Status: ⬜ TODO

#### Step 3.2: Validate Translate Endpoint Input
**Files:** `barApp-backend/api/translate/translate.controller.js`
- Whitelist allowed languages
- Validate input parameters
- Status: ⬜ TODO

#### Step 3.3: Add Authorization Checks
**Files:** `barApp-backend/api/*/` (all controllers)
- Verify resource ownership
- Add company database validation
- Status: ⬜ TODO

#### Step 3.4: Encrypt localStorage Data
**Files:** `barApp-frontend/src/services/async-storage.service.js`
- Install: `npm install crypto-js`
- Encrypt/decrypt cart data
- Status: ⬜ TODO

#### Step 3.5: Add JWT Expiration Check on Client
**Files:** `barApp-frontend/src/services/`
- Decode JWT and check expiration
- Redirect to login if expired
- Status: ⬜ TODO

#### Step 3.6: Sanitize User Data in Responses
**Files:** `barApp-backend/api/user/user.service.js`
- Filter sensitive fields from API responses
- Create data projection utility
- Status: ⬜ TODO

---

### PHASE 4: LOW PRIORITY FIXES

#### Step 4.1: Reduce JSON Payload Limit
**Files:** `barApp-backend/server.js`
- Change from 5MB to 1MB
- Status: ⬜ TODO

#### Step 4.2: Implement API Versioning
**Files:** `barApp-backend/server.js`, all routes
- Add /api/v1/ prefix
- Status: ⬜ TODO

#### Step 4.3: Improve sessionStorage Clearing
**Files:** `barApp-frontend/src/services/http.service.js`
- Clear only auth data on 401
- Status: ⬜ TODO

---

## Testing Plan

After each fix:
1. ✅ Verify no functionality breaks
2. ✅ Test with Postman/Thunder Client
3. ✅ Test in browser (DevTools)
4. ✅ Verify error messages don't expose details
5. ✅ Check security headers with online tools

---

## Deployment Checklist

Before deploying to production:
- [ ] All CRITICAL fixes completed
- [ ] All HIGH priority fixes completed
- [ ] npm audit results clean
- [ ] JWT_SECRET configured in production
- [ ] HTTPS certificate configured
- [ ] Rate limiting tested
- [ ] Error messages tested
- [ ] Security headers verified

---

## Progress Tracking

| Phase | Status | Completion |
|-------|--------|-----------|
| Phase 1: Critical   | ⬜ In Progress | 0% |
| Phase 2: High       | ⬜ Not Started | 0% |
| Phase 3: Medium     | ⬜ Not Started | 0% |
| Phase 4: Low        | ⬜ Not Started | 0% |

---

## Notes

- All changes will be committed with descriptive messages
- Each phase will be tested thoroughly
- Documentation will be updated as needed
- Frontend and backend changes coordinated
