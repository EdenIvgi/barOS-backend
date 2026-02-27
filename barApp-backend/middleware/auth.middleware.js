import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production')
}
const secret = JWT_SECRET || 'baros_dev_secret_change_in_production'

export function signToken(payload) {
    return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export function requireAuth(req, res, next) {
    const token = req.cookies?.baros_token
    if (!token) return res.status(401).json({ error: 'Authentication required' })

    try {
        req.loggedInUser = jwt.verify(token, secret)
        req.userDbName = req.loggedInUser.dbName || `bar_${req.loggedInUser.barId}`
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
