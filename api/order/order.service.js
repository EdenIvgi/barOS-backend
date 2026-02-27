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

async function query(filterBy = {}, dbName) {
    try {
        const orders = await orderModel.getAll(filterBy, dbName)
        return orders
    } catch (error) {
        console.error('[OrderService] Error in query:', error)
        throw error
    }
}

async function getById(orderId, dbName) {
    try {
        const order = await orderModel.getById(orderId, dbName)
        return order
    } catch (error) {
        console.error('[OrderService] Error in getById:', error)
        throw error
    }
}

async function add(order, dbName) {
    try {
        const addedOrder = await orderModel.create(order, dbName)
        return addedOrder
    } catch (error) {
        console.error('[OrderService] Error in add:', error)
        throw error
    }
}

async function update(orderId, order, dbName) {
    try {
        const updatedOrder = await orderModel.update(orderId, order, dbName)
        return updatedOrder
    } catch (error) {
        console.error('[OrderService] Error in update:', error)
        throw error
    }
}

async function remove(orderId, dbName) {
    try {
        const deletedCount = await orderModel.remove(orderId, dbName)
        return deletedCount
    } catch (error) {
        console.error('[OrderService] Error in remove:', error)
        throw error
    }
}

async function updateStatus(orderId, status, dbName) {
    try {
        const updatedOrder = await orderModel.updateStatus(orderId, status, dbName)
        return updatedOrder
    } catch (error) {
        console.error('[OrderService] Error in updateStatus:', error)
        throw error
    }
}

async function getActiveOrders(dbName) {
    try {
        const orders = await orderModel.getAll({ status: { $in: ['pending', 'processing', 'preparing'] } }, dbName)
        return orders
    } catch (error) {
        console.error('[OrderService] Error in getActiveOrders:', error)
        throw error
    }
}
