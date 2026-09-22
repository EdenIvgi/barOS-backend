import express from 'express'
import { login, signup, logout, getInviteCode, regenerateInviteCode } from './auth.controller.js'
import { validate } from '../../middleware/validate.middleware.js'
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js'

const router = express.Router()

const loginSchema = {
    username: { required: true },
    password: { required: true },
}

const signupSchema = {
    username: { required: true, minLength: 3, maxLength: 30 },
    password: { required: true },
    companyName: { required: true, minLength: 1 },
}

router.post('/login', validate(loginSchema), login)
router.post('/signup', validate(signupSchema), signup)
router.post('/logout', logout)
router.get('/invite-code', requireAuth, requireAdmin, getInviteCode)
router.post('/invite-code/regenerate', requireAuth, requireAdmin, regenerateInviteCode)

export const authRoutes = router
