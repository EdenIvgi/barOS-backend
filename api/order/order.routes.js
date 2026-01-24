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

const router = express.Router()

router.get('/', getOrders)
router.get('/active', getActiveOrders)
router.get('/:id', getOrderById)
router.post('/', addOrder)
router.put('/:id', updateOrder)
router.put('/:id/status', updateOrderStatus)
router.delete('/:id', deleteOrder)

export const orderRoutes = router
