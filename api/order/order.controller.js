import { orderService } from './order.service.js'

export async function getOrders(req, res, next) {
    try {
        const orders = await orderService.query(req.query, req.userDbName)
        res.json(orders)
    } catch (error) {
        next(error)
    }
}

export async function getOrderById(req, res, next) {
    try {
        const order = await orderService.getById(req.params.id, req.userDbName)
        if (!order) return res.status(404).json({ error: 'Order not found' })
        res.json(order)
    } catch (error) {
        next(error)
    }
}

export async function addOrder(req, res, next) {
    try {
        const orderData = req.body
        if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
            return res.status(400).json({ error: 'Order must contain at least one item' })
        }

        const supplier = (orderData.supplier != null && String(orderData.supplier).trim() !== '')
            ? String(orderData.supplier).trim()
            : (String(req.query.supplier || '').trim() || '')

        const payload = {
            items: orderData.items,
            userId: orderData.userId ?? null,
            status: orderData.status || 'pending',
            type: orderData.type || 'stock_order',
            supplier,
        }

        const addedOrder = await orderService.add(payload, req.userDbName)
        res.status(201).json(addedOrder)
    } catch (error) {
        next(error)
    }
}

export async function updateOrder(req, res, next) {
    try {
        const { _id, ...updateData } = req.body
        const updatedOrder = await orderService.update(req.params.id, updateData, req.userDbName)
        if (!updatedOrder) return res.status(404).json({ error: 'Order not found' })
        res.json(updatedOrder)
    } catch (error) {
        next(error)
    }
}

export async function deleteOrder(req, res, next) {
    try {
        const deletedCount = await orderService.remove(req.params.id, req.userDbName)
        if (deletedCount === 1) res.json({ message: 'Deleted successfully' })
        else res.status(404).json({ error: 'Order not found' })
    } catch (error) {
        next(error)
    }
}

export async function updateOrderStatus(req, res, next) {
    try {
        const updatedOrder = await orderService.updateStatus(req.params.id, req.body.status, req.userDbName)
        if (!updatedOrder) return res.status(404).json({ error: 'Order not found' })
        res.json(updatedOrder)
    } catch (error) {
        next(error)
    }
}

export async function getActiveOrders(req, res, next) {
    try {
        const orders = await orderService.getActiveOrders(req.userDbName)
        res.json(orders)
    } catch (error) {
        next(error)
    }
}
