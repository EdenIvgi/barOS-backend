import { orderModel } from './order.model.js'

export const orderService = {
    query,
    getById,
    add,
    update,
    remove,
    updateStatus,
    getActiveOrders
}

async function query(filterBy = {}) {
    try {
        const orders = await orderModel.getAll(filterBy)
        return orders
    } catch (error) {
        console.error('[OrderService] Error in query:', error)
        throw error
    }
}

async function getById(orderId) {
    try {
        const order = await orderModel.getById(orderId)
        return order
    } catch (error) {
        console.error('[OrderService] Error in getById:', error)
        throw error
    }
}

async function add(order) {
    try {
        const addedOrder = await orderModel.create(order)
        return addedOrder
    } catch (error) {
        console.error('[OrderService] Error in add:', error)
        throw error
    }
}

async function update(orderId, order) {
    try {
        const updatedOrder = await orderModel.update(orderId, order)
        return updatedOrder
    } catch (error) {
        console.error('[OrderService] Error in update:', error)
        throw error
    }
}

async function remove(orderId) {
    try {
        const deletedCount = await orderModel.remove(orderId)
        return deletedCount
    } catch (error) {
        console.error('[OrderService] Error in remove:', error)
        throw error
    }
}

async function updateStatus(orderId, status) {
    try {
        const updatedOrder = await orderModel.updateStatus(orderId, status)
        return updatedOrder
    } catch (error) {
        console.error('[OrderService] Error in updateStatus:', error)
        throw error
    }
}

async function getActiveOrders() {
    try {
        const orders = await orderModel.getAll({ status: { $in: ['pending', 'processing', 'preparing'] } })
        return orders
    } catch (error) {
        console.error('[OrderService] Error in getActiveOrders:', error)
        throw error
    }
}
