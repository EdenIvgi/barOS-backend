import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production')
}
const secret = JWT_SECRET || 'barapp_dev_secret_change_in_production'

export function signToken(payload) {
    return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export function requireAuth(req, res, next) {
    const token = req.cookies?.barapp_token
    if (!token) return res.status(401).json({ error: 'Authentication required' })

    try {
        req.loggedInUser = jwt.verify(token, secret)
        next()
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' })
    }
}
