import express from 'express'
import {
    getOrders,
    getOrderById,
    addOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
    getActiveOrders
} from './order.controller.js'
import { requireAuth, requireManager } from '../../middleware/auth.middleware.js'

const router = express.Router()

router.get('/', requireAuth, getOrders)
router.get('/active', requireAuth, getActiveOrders)
router.get('/:id', requireAuth, getOrderById)
router.post('/', requireAuth, addOrder)
router.put('/:id', requireAuth, updateOrder)
router.put('/:id/status', requireAuth, updateOrderStatus)
router.delete('/:id', requireAuth, requireManager, deleteOrder)

export const orderRoutes = router
