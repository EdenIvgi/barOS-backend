import express from 'express'
import { getBarBook, saveBarBook, clearBarBook } from './barBook.controller.js'
import { requireAuth, requireManager } from '../../middleware/auth.middleware.js'

const router = express.Router()

router.get('/', getBarBook)
router.put('/', requireAuth, saveBarBook)
router.post('/clear', requireAuth, requireManager, clearBarBook)

export const barBookRoutes = router
