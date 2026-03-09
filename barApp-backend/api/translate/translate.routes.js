import express from 'express'
import { translateText } from './translate.controller.js'
import { requireAuth } from '../../middleware/auth.middleware.js'

const router = express.Router()

router.post('/', requireAuth, translateText)

export const translateRoutes = router
