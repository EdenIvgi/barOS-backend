# barApp Security Audit Report
**Date:** March 10, 2026  
**Project:** barApp (Backend + Frontend)

---

## Executive Summary

This comprehensive security audit identified **15 security vulnerabilities** across the barApp codebase, ranging from **Critical** to **Low** severity. The findings indicate several important areas requiring immediate remediation, particularly around authentication, password policies, and HTTP security headers.

---

## 1. BACKEND SECURITY FINDINGS

### 1.1 Missing Security Headers (Helmet.js)
**File:** [barApp-backend/server.js](barApp-backend/server.js#L1-L25)  
**Severity:** **HIGH**  
**Type:** Missing Security Headers  
**Description:**  
The application does not implement HTTP security headers using helmet.js. Critical security headers are missing:
- **Content-Security-Policy (CSP)** - Protection against XSS attacks
- **Strict-Transport-Security (HSTS)** - Forces HTTPS connection
- **X-Frame-Options** - Prevents clickjacking
- **X-Content-Type-Options** - Prevents MIME sniffing
- **Referrer-Policy** - Controls referrer information

**Current Setup:** Basic CORS configuration present, but no comprehensive security headers.

**Code:**
```javascript
// server.js has CORS, sanitization, and rate limiting
// BUT missing: helmet.js, CSP headers, HSTS, X-Frame-Options
```

**Recommendation:**  
Install and configure `helmet.js`:
```bash
npm install helmet
```
Then add in server.js:
```javascript
import helmet from 'helmet'
app.use(helmet())
```

---

### 1.2 Weak Password Requirements
**File:** [barApp-backend/api/auth/auth.routes.js](barApp-backend/api/auth/auth.routes.js#L13)  
**Severity:** **HIGH**  
**Type:** Weak Authentication Policy  
**Description:**  
Password minimum length is only 4 characters. This is insufficient for security and fails to meet industry standards (minimum 8-12 characters recommended).

**Current Code:**
```javascript
const signupSchema = {
    username: { required: true, minLength: 3, maxLength: 30 },
    password: { required: true, minLength: 4 },  // ← Too short!
    companyName: { required: true, minLength: 1 },
}
```

**Recommendation:**  
- Increase minimum password length to 12 characters
- Add password complexity requirements (uppercase, lowercase, numbers, special characters)
- Example:
```javascript
const signupSchema = {
    username: { required: true, minLength: 3, maxLength: 30 },
    password: { required: true, minLength: 12, requireSpecialChar: true, requireNumber: true },
    companyName: { required: true, minLength: 1 },
}
```

---

### 1.3 JWT Secret Not Required in Production
**File:** [barApp-backend/middleware/auth.middleware.js](barApp-backend/middleware/auth.middleware.js#L1-L6)  
**Severity:** **CRITICAL**  
**Type:** Weak JWT Configuration  
**Description:**  
The JWT secret is only validated to be required in production. Without a proper secret, JWT tokens can be forged.

**Current Code:**
```javascript
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production')
}
const secret = JWT_SECRET || 'baros_dev_secret_change_in_production'  // ← Hardcoded default!
```

**Issues:**
- Development hardcoded secret could be accidentally used in production
- No warning system if JWT_SECRET is missing

**Recommendation:**  
```javascript
const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required')
}

// Never allow production without explicit secret
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'baros_dev_secret_change_in_production') {
    throw new Error('Must not use default JWT secret in production!')
}
```

---

### 1.4 User Endpoint May Return Sensitive Data
**File:** [barApp-backend/api/user/user.service.js](barApp-backend/api/user/user.service.js#L1-L20) & [user.model.js](barApp-backend/api/user/user.model.js#L1-L40)  
**Severity:** **MEDIUM**  
**Type:** Information Disclosure  
**Description:**  
The `/api/user` endpoint returns user data without explicitly filtering sensitive fields. While the auth model deletes password after login, there's no guarantee the user endpoint filters all sensitive fields.

**Current Code:**
```javascript
// user.model.js getAll() - returns raw user data
async function getAll(filterBy = {}, dbName) {
    const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
    const criteria = {}
    if (filterBy.username) {
        criteria.username = filterBy.username
    }
    const users = await collection.find(criteria).toArray()
    return users  // ← Could contain password, internal fields
}
```

**Recommendation:**  
Explicitly filter sensitive fields:
```javascript
async function getAll(filterBy = {}, dbName) {
    const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
    const criteria = {}
    if (filterBy.username) {
        criteria.username = filterBy.username
    }
    const users = await collection.find(criteria).project({ password: 0 }).toArray()
    return users.map(user => ({
        _id: user._id,
        username: user.username,
        fullname: user.fullname,
        role: user.role,
        createdAt: user.createdAt
        // Exclude: password, companyName, companyDisplayName, dbName
    }))
}
```

---

### 1.5 No CSRF Protection
**File:** [barApp-backend/server.js](barApp-backend/server.js#L40-L55)  
**Severity:** **MEDIUM**  
**Type:** CSRF Vulnerability  
**Description:**  
No CSRF token validation is implemented. While cookies are used with SameSite=strict (good), explicit CSRF protection should be added.

**Current Protection:**
```javascript
const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'strict',  // ← Good, but not enough
    maxAge: 7 * 24 * 60 * 60 * 1000,
    ...(process.env.NODE_ENV === 'production' && { secure: true }),
}
```

**Recommendation:**  
Install CSRF middleware:
```bash
npm install csurf
```

---

### 1.6 Rate Limiting May Be Too Permissive
**File:** [barApp-backend/server.js](barApp-backend/server.js#L65-L80)  
**Severity:** **MEDIUM**  
**Type:** DoS Prevention  
**Description:**  
General API rate limit is 500 requests per 15 minutes, which may be too permissive for a critical business application.

**Current Code:**
```javascript
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,  // ← 500 requests per 15 min = ~33 req/min
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
})
```

**Recommendation:**  
- Reduce to 100 requests per 15 minutes (6-7 req/min)
- Implement stricter limits for specific endpoints:
```javascript
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    skip: (req) => req.user?.role === 'admin'  // Admins get higher limits
})
```

---

### 1.7 Error Stack Traces Exposed in Development
**File:** [barApp-backend/middleware/error.middleware.js](barApp-backend/middleware/error.middleware.js#L11-L17)  
**Severity:** **MEDIUM**  
**Type:** Information Disclosure  
**Description:**  
Stack traces are returned in error responses when `NODE_ENV !== 'production'`. This can leak implementation details.

**Current Code:**
```javascript
res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && status === 500 && { stack: err.stack }),
})
```

**Recommendation:**  
Only include stack traces in logs, never in API responses:
```javascript
res.status(status).json({
    error: message,
    // Never include stack in response
})
logger.error(`[${status}] ${message}`, err.stack)
```

---

### 1.8 Insufficient Input Validation for Translate Endpoint
**File:** [barApp-backend/api/translate/translate.controller.js](barApp-backend/api/translate/translate.controller.js#L1-L12)  
**Severity:** **MEDIUM**  
**Type:** Injection Vulnerability (API Misuse)  
**Description:**  
The translate endpoint accepts user-supplied language parameters without strict validation, allowing potential injection attacks on the Google Translate API.

**Current Code:**
```javascript
export async function translateText(req, res, next) {
  try {
    const { text, sourceLang } = req.body
    if (!text?.trim()) return res.json({ he: text || '', en: text || '' })
    const targetLang = sourceLang === 'he' ? 'en' : 'he'  // ← Limited validation
    const result = await translate(text, { from: sourceLang, to: targetLang })
    res.json({ [sourceLang]: text, [targetLang]: result.text })
  } catch (error) {
    next(error)
  }
}
```

**Recommendation:**  
```javascript
const ALLOWED_LANGS = ['en', 'he', 'es', 'fr']  // Whitelist

export async function translateText(req, res, next) {
  try {
    const { text, sourceLang } = req.body
    
    if (!text?.trim()) return res.json({ he: text || '', en: text || '' })
    
    if (!ALLOWED_LANGS.includes(sourceLang)) {
      return res.status(400).json({ error: 'Invalid source language' })
    }
    
    const targetLang = sourceLang === 'he' ? 'en' : 'he'
    const result = await translate(text, { from: sourceLang, to: targetLang })
    res.json({ [sourceLang]: text, [targetLang]: result.text })
  } catch (error) {
    next(error)
  }
}
```

---

### 1.9 No Request Size Limit Validation
**File:** [barApp-backend/server.js](barApp-backend/server.js#L57)  
**Severity:** **LOW**  
**Type:** DoS / Resource Exhaustion  
**Description:**  
JSON payload limit is set to 5MB, which might be too large for this application. No specific validation for the barBook content size.

**Current Code:**
```javascript
app.use(express.json({ limit: '5mb' }))
```

**Recommendation:**  
Reduce to 1-2MB and implement specific limits for sensitive endpoints.

---

## 2. FRONTEND SECURITY FINDINGS

### 2.1 User Token Stored in SessionStorage (Potential XSS Target)
**File:** [barApp-frontend/src/services/user.service.js](barApp-frontend/src/services/user.service.js#L22-L57)  
**Severity:** **HIGH**  
**Type:** XSS Vulnerability (Indirect)  
**Description:**  
User data including full user object is stored in `sessionStorage` without additional encryption. If an XSS vulnerability exists anywhere in the app, attackers can access this data.

**Current Code:**
```javascript
function _setLoggedInUser(user) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))  // ← Readable by XSS
}

function getLoggedInUser() {
  try {
    const entity = sessionStorage.getItem(STORAGE_KEY)
    return entity ? JSON.parse(entity) : null
  } catch {
    return null
  }
}
```

**Recommendation:**  
- Keep token-only in httpOnly cookie (already done)
- Don't store sensitive user data in sessionStorage
- Store only non-sensitive user metadata if needed:
```javascript
function _setLoggedInUser(user) {
  // Only store what's necessary for UI display
  const uiData = {
    _id: user._id,
    username: user.username,
    role: user.role,
    companyDisplayName: user.companyDisplayName
    // Don't store: password, dbName, companyName, sensitive fields
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(uiData))
}
```

---

### 2.2 Redux Store Exposed in Development Mode
**File:** [barApp-frontend/src/store/store.js](barApp-frontend/src/store/store.js#L17-L19)  
**Severity:** **MEDIUM**  
**Type:** Information Disclosure  
**Description:**  
Redux store is exposed on `window.gStore` in development mode, allowing easy inspection of all application state including user data.

**Current Code:**
```javascript
if (import.meta.env.DEV) {
  window.gStore = store  // ← Exposes entire Redux state
}
```

**Recommendation:**  
Remove in production build (already conditional), but be aware this is a debugging liability.

---

### 2.3 No Content Security Policy (CSP)
**File:** Frontend (all)  
**Severity:** **HIGH**  
**Type:** XSS Protection  
**Description:**  
No Content Security Policy is implemented on the frontend. This allows inline scripts and other XSS attack vectors.

**Recommendation:**  
Add CSP headers from backend or configure in vite.config.js:
```javascript
// vite.config.js
export default {
  server: {
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
    }
  }
}
```

---

### 2.4 Local Storage Used for Cart Data Without Encryption
**File:** [barApp-frontend/src/services/async-storage.service.js](barApp-frontend/src/services/async-storage.service.js#L18-L28)  
**Severity:** **LOW**  
**Type:** Data Privacy  
**Description:**  
Order/cart data is stored in plain text in localStorage without encryption.

**Current Code:**
```javascript
function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))  // ← Plain text
  } catch (error) {
    console.error(`Failed to save ${key} to storage:`, error)
  }
}
```

**Note:** This is lower severity since cart data is typically non-sensitive, but it's a best practice to encrypt.

---

### 2.5 Insecure HTTP Communication Check
**File:** [barApp-frontend/src/services/http.service.js](barApp-frontend/src/services/http.service.js#L1-L47)  
**Severity:** **MEDIUM**  
**Type:** Transport Security  
**Description:**  
HTTP service doesn't enforce HTTPS in production mode.

**Current Code:**
```javascript
const BASE_URL = process.env.NODE_ENV === 'production' ? '/api/' : (import.meta.env.VITE_API_BASE_URL || '/api/')
```

**Recommendation:**  
Add protocol check:
```javascript
if (process.env.NODE_ENV === 'production' && window.location.protocol !== 'https:') {
  console.error('SECURITY: Application must run over HTTPS')
  // Could redirect or throw error
}
```

---

### 2.6 Session Storage Fully Cleared on 401
**File:** [barApp-frontend/src/services/http.service.js](barApp-frontend/src/services/http.service.js#L41-L43)  
**Severity:** **LOW**  
**Type:** Session Management  
**Description:**  
On 401 errors, entire sessionStorage is cleared. While generally OK, it could cause issues with other valid data stored there.

**Current Code:**
```javascript
if (err.response && err.response.status === 401) {
  sessionStorage.clear()  // ← Clears ALL sessionStorage
}
```

**Recommendation:**  
Clear only auth-related data:
```javascript
if (err.response && err.response.status === 401) {
  sessionStorage.removeItem(STORAGE_KEY)  // Specific key only
}
```

---

## 3. GENERAL APPLICATION SECURITY FINDINGS

### 3.1 Environment Variables Not Properly Protected
**File:** [barApp-backend/config/dev.js](barApp-backend/config/dev.js#L1-L3) & [prod.js](barApp-backend/config/prod.js#L1-L3)  
**Severity:** **CRITICAL**  
**Type:** Secrets Management  
**Description:**  
Database URL is loaded from environment variables, but there's no validation that it's properly configured for each environment.

**Risk:** Database credentials could be exposed if `.env` file is committed to version control.

**Recommendation:**
- Never commit `.env` files to Git
- Add `.env` to `.gitignore`
- Use environment-specific `.env` files: `.env.production`, `.env.development`
- Document all required env vars in `.env.example`

---

### 3.2 No Database Connection String Encryption
**File:** [barApp-backend/server.js](barApp-backend/server.js#L1)  
**Severity:** **MEDIUM**  
**Type:** Secrets Management  
**Description:**  
MongoDB connection string is passed in plain text through environment variables. If logs are captured, credentials could be exposed.

**Recommendation:**  
Use connection options to mask credentials:
```javascript
const mongoUrl = new URL(config.dbURL)
// Log sanitized version
logger.info(`Connected to MongoDB: ${mongoUrl.hostname}`)
```

---

### 3.3 No HTTPS Enforcement in Production
**File:** [barApp-backend/api/auth/auth.controller.js](barApp-backend/api/auth/auth.controller.js#L6-L10)  
**Severity:** **HIGH**  
**Type:** Transport Security  
**Description:**  
Secure cookie flag only set in production, but there's no enforcement that the API itself runs over HTTPS.

**Current Code:**
```javascript
const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    ...(process.env.NODE_ENV === 'production' && { secure: true }),  // ← Only in production
}
```

**Recommendation:**  
Always use HTTPS in production and add HSTS header.

---

### 3.4 Insufficient Authorization Checks
**File:** Multiple API endpoints  
**Severity:** **MEDIUM**  
**Type:** Authorization  
**Description:**  
While routes use `requireAuth` middleware, there's no fine-grained authorization to verify users can only access their own company's data. A user from Company A could potentially access Company B's data through direct database name manipulation.

**Review Findings:**
- ✓ Auth endpoints protected with requireAuth
- ✓ Item, order, category endpoints protected
- ✗ No verification that `req.userDbName` actually belongs to the logged-in user
- ✗ No ownership checks when updating/deleting resources

**Recommendation:**  
Add ownership validation:
```javascript
async function getOrderById(req, res, next) {
  try {
    const order = await orderService.getById(req.params.id, req.userDbName)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    
    // Verify order belongs to user's company (already done via req.userDbName)
    // But add explicit check:
    if (order.companyDbName && order.companyDbName !== req.userDbName) {
      return res.status(403).json({ error: 'Access denied' })
    }
    
    res.json(order)
  } catch (error) {
    next(error)
  }
}
```

---

### 3.5 No API Versioning
**File:** [barApp-backend/server.js](barApp-backend/server.js#L85-L92)  
**Severity:** **LOW**  
**Type:** API Maintenance  
**Description:**  
API endpoints don't have versioning (e.g., `/api/v1/`). Breaking changes could cause issues.

**Recommendation:**  
Implement API versioning to enable backward compatibility.

---

## 4. DEPENDENCY SECURITY

### 4.1 Outdated Dependencies
**File:** [barApp-backend/package.json](barApp-backend/package.json) & [barApp-frontend/package.json](barApp-frontend/package.json)  
**Severity:** **MEDIUM**  
**Type:** Supply Chain  
**Description:**  
Should regularly check for security vulnerabilities in dependencies.

**Recommendation:**
```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm audit fix

# Regular security scanning
npm run security-check
```

---

## 5. AUTHENTICATION FLOW ISSUES

### 5.1 Token Expiration Not Validated on Client
**File:** Frontend authentication logic  
**Severity:** **MEDIUM**  
**Type:** Session Management  
**Description:**  
Frontend doesn't check JWT expiration time. Token could remain valid in Redux state even after it expires on the server.

**Recommendation:**  
Decode JWT on client and check expiration:
```javascript
function isTokenExpired(token) {
  const decoded = jwtDecode(token)
  return decoded.exp * 1000 < Date.now()
}
```

---

## 6. SUMMARY TABLE

| ID | File | Vulnerability | Severity | Type |
|---|---|---|---|---|
| 1.1 | server.js | Missing Helmet.js Headers | HIGH | Security Headers |
| 1.2 | auth.routes.js | Weak Password Policy | HIGH | Authentication |
| 1.3 | auth.middleware.js | Hardcoded JWT Secret | CRITICAL | Cryptography |
| 1.4 | user.service.js | Sensitive Data Leakage | MEDIUM | Data Protection |
| 1.5 | server.js | No CSRF Protection | MEDIUM | CSRF |
| 1.6 | server.js | Permissive Rate Limiting | MEDIUM | DoS |
| 1.7 | error.middleware.js | Stack Traces Exposed | MEDIUM | Information Disclosure |
| 1.8 | translate.controller.js | Insufficient Input Validation | MEDIUM | Injection |
| 1.9 | server.js | Large Request Limit | LOW | DoS |
| 2.1 | user.service.js | SessionStorage XSS Target | HIGH | XSS |
| 2.2 | store.js | Redux Exposed in Dev | MEDIUM | Information Disclosure |
| 2.3 | Frontend All | Missing CSP | HIGH | XSS |
| 2.4 | async-storage.service.js | Unencrypted Local Storage | LOW | Data Privacy |
| 2.5 | http.service.js | No HTTPS Enforcement | MEDIUM | Transport Security |
| 2.6 | http.service.js | Overly Broad Session Clear | LOW | Session Management |
| 3.1 | config/dev.js, prod.js | Env Var Exposure | CRITICAL | Secrets |
| 3.2 | server.js | No Connection String Encryption | MEDIUM | Secrets |
| 3.3 | auth.controller.js | No HTTPS Enforcement | HIGH | Transport Security |
| 3.4 | Multiple | Insufficient Authorization | MEDIUM | Authorization |
| 3.5 | server.js | No API Versioning | LOW | Maintenance |

---

## 7. PRIORITIZED REMEDIATION PLAN

### CRITICAL (Immediate - Fix within 1 week)
1. Set proper JWT_SECRET for production
2. Protect environment variables (don't commit .env)
3. Implement HTTPS enforcement
4. Add helmet.js for security headers

### HIGH (Fix within 2 weeks)
1. Increase password minimum length to 12 characters
2. Add Content Security Policy
3. Remove user data from sessionStorage
4. Implement proper CSRF protection

### MEDIUM (Fix within 1 month)
1. Reduce rate limiting thresholds
2. Remove error stack traces from responses
3. Add input validation to translate endpoint
4. Implement authorization ownership checks
5. Add HTTPS enforcement check in frontend
6. Encrypt localStorage data

### LOW (Fix within 2 months)
1. Reduce request size limits
2. Implement API versioning
3. Fix sessionStorage clearing logic

---

## 8. CONCLUSION

The barApp application has a reasonable security foundation with authentication, rate limiting, and database access patterns already in place. However, several critical issues must be addressed before production deployment, particularly around:

- JWT secret management
- Sensitive data exposure
- Transport layer security
- Input validation

A follow-up security audit is recommended after implementing these recommendations.

