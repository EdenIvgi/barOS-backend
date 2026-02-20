import { dbService } from '../../services/mongo.service.js'
import { toObjectId } from '../../services/objectId.service.js'

const COLLECTION_NAME = 'order'

export const orderModel = {
    getAll,
    getById,
    create,
    update,
    remove,
    updateStatus
}

function normalizeOrder(o) {
    return { ...o, supplier: o.supplier != null ? String(o.supplier) : '' }
}

async function getAll(filterBy = {}) {
    const collection = await dbService.getCollection(COLLECTION_NAME)

    const criteria = {}
    if (filterBy.userId) criteria.userId = filterBy.userId
    if (filterBy.status) criteria.status = filterBy.status
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

    const orders = await collection.find(criteria).sort({ createdAt: -1 }).toArray()
    return orders.map(normalizeOrder)
}

async function getById(orderId) {
    const collection = await dbService.getCollection(COLLECTION_NAME)
    const objId = toObjectId(orderId)
    const filter = objId ? { _id: objId } : { _id: orderId }
    const order = await collection.findOne(filter)
    if (!order) return null
    return normalizeOrder(order)
}

async function create(orderData) {
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
}

async function update(orderId, updateData) {
    const collection = await dbService.getCollection(COLLECTION_NAME)
    const objId = toObjectId(orderId)
    const filter = objId ? { _id: objId } : { _id: orderId }

    const { _id, createdAt, ...rest } = updateData
    const dataToUpdate = {}
    for (const [k, v] of Object.entries(rest)) {
        if (v !== undefined) dataToUpdate[k] = v
    }

    if (dataToUpdate.items) {
        dataToUpdate.totalAmount = dataToUpdate.items.reduce((sum, item) => sum + (item.subtotal || 0), 0)
    }
    dataToUpdate.updatedAt = Date.now()

    const result = await collection.updateOne(filter, { $set: dataToUpdate })
    if (result.matchedCount === 0) return null
    return getById(orderId)
}

async function updateStatus(orderId, status) {
    const collection = await dbService.getCollection(COLLECTION_NAME)
    const objId = toObjectId(orderId)
    const filter = objId ? { _id: objId } : { _id: orderId }
    const result = await collection.updateOne(filter, { $set: { status, updatedAt: Date.now() } })
    if (result.matchedCount === 0) return null
    return getById(orderId)
}

async function remove(orderId) {
    const collection = await dbService.getCollection(COLLECTION_NAME)
    const objId = toObjectId(orderId)
    const filter = objId ? { _id: objId } : { _id: orderId }
    const result = await collection.deleteOne(filter)
    return result.deletedCount
}
