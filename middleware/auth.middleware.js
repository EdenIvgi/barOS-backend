import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'barapp_dev_secret_change_in_production'

/**
 * Signs a JWT token for the given user payload.
 */
export function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Express middleware — verifies JWT from httpOnly cookie.
 * Attaches the decoded user to req.loggedInUser.
 * Returns 401 if token is missing or invalid.
 */
export function requireAuth(req, res, next) {
    const token = req.cookies?.barapp_token
    if (!token) return res.status(401).json({ error: 'Authentication required' })

    try {
        req.loggedInUser = jwt.verify(token, JWT_SECRET)
        next()
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' })
    }
}
