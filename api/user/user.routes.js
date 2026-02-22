import express from 'express'
import { getUsers } from './user.controller.js'
import { requireAuth } from '../../middleware/auth.middleware.js'

const router = express.Router()

router.get('/', requireAuth, getUsers)

export const userRoutes = router
