import express from 'express'
import { scanProduct, scanStatus } from './scan.controller.js'
import { requireAuth } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'

const router = express.Router()

const scanSchema = {
    data: { required: true, isString: true },
}

router.get('/status', requireAuth, scanStatus)
router.post('/product', requireAuth, validate(scanSchema), scanProduct)

export const scanRoutes = router
