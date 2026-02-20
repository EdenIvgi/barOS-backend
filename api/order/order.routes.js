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
import { requireAuth } from '../../middleware/auth.middleware.js'

const router = express.Router()

router.get('/', getOrders)
router.get('/active', getActiveOrders)
router.get('/:id', getOrderById)
router.post('/', requireAuth, addOrder)
router.put('/:id', requireAuth, updateOrder)
router.put('/:id/status', requireAuth, updateOrderStatus)
router.delete('/:id', requireAuth, deleteOrder)

export const orderRoutes = router
