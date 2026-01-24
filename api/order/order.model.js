import { dbService } from '../../services/mongo.service.js'
import { ObjectId } from 'mongodb'

const COLLECTION_NAME = 'order'

export const orderModel = {
    getAll,
    getById,
    create,
    update,
    remove,
    updateStatus
}

async function getAll(filterBy = {}) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        
        const criteria = {}
        if (filterBy.userId) {
            criteria.userId = filterBy.userId
        }
        if (filterBy.status) {
            criteria.status = filterBy.status
        }

        const orders = await collection
            .find(criteria)
            .sort({ createdAt: -1 })
            .toArray()

        return orders
    } catch (error) {
        console.error('[OrderModel] Error getting orders:', error)
        throw error
    }
}

async function getById(orderId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const order = await collection.findOne({ _id: ObjectId.createFromHexString(orderId) })
        return order
    } catch (error) {
        console.error('[OrderModel] Error getting order by id:', error)
        throw error
    }
}

async function create(orderData) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        
        const totalAmount = orderData.items.reduce((sum, item) => sum + item.subtotal, 0)
        
        const orderToAdd = {
            items: orderData.items,
            userId: orderData.userId,
            status: orderData.status || 'pending',
            totalAmount,
            createdAt: Date.now(),
            updatedAt: Date.now()
        }

        const result = await collection.insertOne(orderToAdd)
        orderToAdd._id = result.insertedId

        return orderToAdd
    } catch (error) {
        console.error('[OrderModel] Error creating order:', error)
        throw error
    }
}

async function update(orderId, updateData) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        
        if (updateData.items) {
            updateData.totalAmount = updateData.items.reduce((sum, item) => sum + item.subtotal, 0)
        }
        updateData.updatedAt = Date.now()
        
        const result = await collection.updateOne(
            { _id: ObjectId.createFromHexString(orderId) },
            { $set: updateData }
        )
        
        if (result.matchedCount === 0) {
            return null
        }
        
        return await getById(orderId)
    } catch (error) {
        console.error('[OrderModel] Error updating order:', error)
        throw error
    }
}

async function updateStatus(orderId, status) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const result = await collection.updateOne(
            { _id: ObjectId.createFromHexString(orderId) },
            { $set: { status, updatedAt: Date.now() } }
        )
        
        if (result.matchedCount === 0) {
            return null
        }
        
        return await getById(orderId)
    } catch (error) {
        console.error('[OrderModel] Error updating order status:', error)
        throw error
    }
}

async function remove(orderId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const result = await collection.deleteOne({ _id: ObjectId.createFromHexString(orderId) })
        return result.deletedCount
    } catch (error) {
        console.error('[OrderModel] Error removing order:', error)
        throw error
    }
}
