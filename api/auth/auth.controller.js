import { authService } from './auth.service.js'
import { signToken } from '../../middleware/auth.middleware.js'

const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    ...(process.env.NODE_ENV === 'production' && { secure: true }),
}

export async function login(req, res, next) {
    try {
        const { username, password } = req.body
        const user = await authService.login(username, password)
        const token = signToken({ _id: user._id, username: user.username, role: user.role || 'bartender', dbName: user.dbName, companyName: user.companyName, companyDisplayName: user.companyDisplayName })
        res.cookie('baros_token', token, COOKIE_OPTIONS)
        res.json(user)
    } catch (error) {
        next(error)
    }
}

export async function signup(req, res, next) {
    try {
        const user = await authService.signup(req.body)
        const token = signToken({ _id: user._id, username: user.username, role: user.role || 'bartender', dbName: user.dbName, companyName: user.companyName, companyDisplayName: user.companyDisplayName })
        res.cookie('baros_token', token, COOKIE_OPTIONS)
        res.status(201).json(user)
    } catch (error) {
        next(error)
    }
}

export async function getInviteCode(req, res, next) {
    try {
        const { dbName, companyDisplayName } = req.loggedInUser
        const inviteCode = await authService.getInviteCode(dbName, companyDisplayName)
        res.json({ inviteCode })
    } catch (error) {
        next(error)
    }
}

export async function regenerateInviteCode(req, res, next) {
    try {
        const { dbName, companyDisplayName } = req.loggedInUser
        const inviteCode = await authService.regenerateInviteCode(dbName, companyDisplayName)
        res.json({ inviteCode })
    } catch (error) {
        next(error)
    }
}

export async function logout(req, res, next) {
    try {
        res.clearCookie('baros_token')
        res.json({ message: 'Logged out successfully' })
    } catch (error) {
        next(error)
    }
}
