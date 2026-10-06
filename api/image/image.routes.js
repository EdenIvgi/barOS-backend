import express from 'express'
import { uploadImage, serveImage } from './image.controller.js'
import { requireAuth } from '../../middleware/auth.middleware.js'

const router = express.Router()

// Both sides are authenticated, and both resolve the bucket from the caller's own
// tenant, so one bar can neither read nor write another bar's photographs.
router.post('/', requireAuth, uploadImage)
router.get('/:id', requireAuth, serveImage)

export const imageRoutes = router
