import { orderService } from './order.service.js'

export async function getOrders(req, res) {
    try {
        const orders = await orderService.query(req.query)
        res.json(orders)
    } catch (error) {
        console.error('[Controller] Error getting orders:', error)
        res.status(500).json({ error: 'Failed to get orders' })
    }
}

export async function getOrderById(req, res) {
    try {
        const { id: orderId } = req.params
        const order = await orderService.getById(orderId)
        if (!order) {
            return res.status(404).json({ error: 'Order not found' })
        }
        res.json(order)
    } catch (error) {
        console.error('[Controller] Error getting order by id:', error)
        res.status(500).json({ error: 'Failed to get order' })
    }
}

export async function addOrder(req, res) {
    try {
        const orderData = req.body
        
        // Validate that order has items
        if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
            return res.status(400).json({ error: 'Order must contain at least one item' })
        }
        
        const addedOrder = await orderService.add(orderData)
        res.status(201).json(addedOrder)
    } catch (error) {
        console.error('[Controller] Error adding order:', error)
        res.status(500).json({ error: 'Failed to add order', details: error.message })
    }
}

export async function updateOrder(req, res) {
    try {
        const { id: orderId } = req.params
        const orderData = req.body
        
        // Make sure we don't update _id
        const { _id, ...updateData } = orderData
        
        const updatedOrder = await orderService.update(orderId, updateData)
        if (!updatedOrder) {
            return res.status(404).json({ error: 'Order not found' })
        }
        res.json(updatedOrder)
    } catch (error) {
        console.error('[Controller] Error updating order:', error)
        res.status(500).json({ error: 'Failed to update order' })
    }
}

export async function deleteOrder(req, res) {
    try {
        const { id: orderId } = req.params
        const deletedCount = await orderService.remove(orderId)
        if (deletedCount === 1) {
            res.json({ message: 'Deleted successfully' })
        } else {
            res.status(404).json({ error: 'Order not found' })
        }
    } catch (error) {
        console.error('[Controller] Error deleting order:', error)
        res.status(500).json({ error: 'Failed to delete order' })
    }
}

export async function updateOrderStatus(req, res) {
    try {
        const { id: orderId } = req.params
        const { status } = req.body
        const updatedOrder = await orderService.updateStatus(orderId, status)
        if (!updatedOrder) {
            return res.status(404).json({ error: 'Order not found' })
        }
        res.json(updatedOrder)
    } catch (error) {
        console.error('[Controller] Error updating order status:', error)
        res.status(500).json({ error: 'Failed to update order status' })
    }
}

export async function getActiveOrders(req, res) {
    try {
        const orders = await orderService.getActiveOrders()
        res.json(orders)
    } catch (error) {
        console.error('[Controller] Error getting active orders:', error)
        res.status(500).json({ error: 'Failed to get active orders' })
    }
}
