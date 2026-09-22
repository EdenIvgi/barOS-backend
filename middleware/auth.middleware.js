import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
    const message = 'SECURITY ERROR: JWT_SECRET environment variable is required'
    if (process.env.NODE_ENV === 'production') {
        throw new Error(message)
    }
    console.warn(message + ' - using development default (NOT FOR PRODUCTION)')
}

// Never use a default secret - force explicit configuration
const secret = JWT_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be set in production environment')
    }
    return 'dev_secret_this_must_be_changed_in_production_env'
})()

export function signToken(payload) {
    return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export function requireAuth(req, res, next) {
    const token = req.cookies?.baros_token
    if (!token) return res.status(401).json({ error: 'Authentication required' })

    try {
        req.loggedInUser = jwt.verify(token, secret)

        // Tokens issued before the multi-tenant migration carry no dbName. Without it
        // the driver would silently fall back to the connection string's default
        // database, so reject the token and force a fresh login instead.
        if (!req.loggedInUser.dbName) {
            return res.status(401).json({ error: 'Session is outdated, please log in again' })
        }

        req.userDbName = req.loggedInUser.dbName
        next()
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' })
    }
}

export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.loggedInUser) return res.status(401).json({ error: 'Authentication required' })
        const userRole = req.loggedInUser.role || 'bartender'
        if (!roles.includes(userRole)) {
            return res.status(403).json({ error: 'Insufficient permissions' })
        }
        next()
    }
}

export function requireAdmin(req, res, next) {
    return requireRole('admin')(req, res, next)
}

export function requireManager(req, res, next) {
    return requireRole('admin', 'manager')(req, res, next)
}
