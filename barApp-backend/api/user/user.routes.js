import express from 'express'
import { getUsers } from './user.controller.js'
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js'

const router = express.Router()

router.get('/', requireAuth, requireAdmin, getUsers)

export const userRoutes = router
