import express from 'express'
import { login, signup, logout } from './auth.controller.js'
import { validate } from '../../middleware/validate.middleware.js'

const router = express.Router()

const loginSchema = {
    username: { required: true },
    password: { required: true },
}

const signupSchema = {
    username: { required: true, minLength: 3, maxLength: 30 },
    password: { required: true, minLength: 12, requireComplexity: true },
    companyName: { required: true, minLength: 1 },
}

router.post('/login', validate(loginSchema), login)
router.post('/signup', validate(signupSchema), signup)
router.post('/logout', logout)

export const authRoutes = router
