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
        if (filterBy.supplier !== undefined && filterBy.supplier !== '') {
            const s = String(filterBy.supplier).trim()
            if (s === 'ללא ספק') {
                criteria.$or = [
                    { supplier: '' },
                    { supplier: null },
                    { supplier: 'ללא ספק' },
                    { supplier: { $exists: false } }
                ]
            } else {
                criteria.supplier = s
            }
        }

        const orders = await collection
            .find(criteria)
            .sort({ createdAt: -1 })
            .toArray()

        return orders.map((o) => ({
            ...o,
            supplier: o.supplier != null ? String(o.supplier) : ''
        }))
    } catch (error) {
        console.error('[OrderModel] Error getting orders:', error)
        throw error
    }
}

async function getById(orderId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const order = await collection.findOne({ _id: ObjectId.createFromHexString(orderId) })
        if (!order) return null
        return {
            ...order,
            supplier: order.supplier != null ? String(order.supplier) : ''
        }
    } catch (error) {
        console.error('[OrderModel] Error getting order by id:', error)
        throw error
    }
}

async function create(orderData) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)

        const totalAmount = orderData.items.reduce((sum, item) => sum + (item.subtotal || 0), 0)
        const supplier = orderData.supplier != null ? String(orderData.supplier).trim() : ''

        const orderToAdd = {
            items: orderData.items || [],
            userId: orderData.userId || null,
            status: orderData.status || 'pending',
            type: orderData.type || 'stock_order',
            supplier,
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

        // Don't update _id or createdAt; drop undefined so we don't overwrite e.g. supplier with undefined
        const { _id, createdAt, ...rest } = updateData
        const dataToUpdate = {}
        for (const [k, v] of Object.entries(rest)) {
            if (v !== undefined) dataToUpdate[k] = v
        }

        if (dataToUpdate.items) {
            dataToUpdate.totalAmount = dataToUpdate.items.reduce((sum, item) => sum + (item.subtotal || 0), 0)
        }
        dataToUpdate.updatedAt = Date.now()

        const result = await collection.updateOne(
            { _id: ObjectId.createFromHexString(orderId) },
            { $set: dataToUpdate }
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
