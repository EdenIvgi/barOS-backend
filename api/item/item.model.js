import { dbService } from '../../services/mongo.service.js'
import { ObjectId } from 'mongodb'
import { toObjectId } from '../../services/objectId.service.js'

const COLLECTION_NAME = 'items'

export const itemModel = {
    getAll,
    getById,
    create,
    update,
    remove,
    updateStock
}

async function getAll(filterBy = {}, dbName) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
        const criteria = {}

        if (filterBy.txt) {
            criteria.$or = [
                { name: { $regex: filterBy.txt, $options: 'i' } },
                { nameEn: { $regex: filterBy.txt, $options: 'i' } },
                { description: { $regex: filterBy.txt, $options: 'i' } },
                { supplier: { $regex: filterBy.txt, $options: 'i' } },
            ]
        }

        if (filterBy.categoryId || filterBy.category) {
            criteria.category = filterBy.categoryId || filterBy.category
        }

        if (filterBy.supplier) {
            criteria.supplier = filterBy.supplier
        }

        if (filterBy.isAvailable !== null && filterBy.isAvailable !== undefined) {
            criteria.isAvailable = filterBy.isAvailable === 'true' || filterBy.isAvailable === true
        }

        return collection.find(criteria).sort({ name: 1 }).toArray()
    } catch (error) {
        console.error('[ItemModel] Error getting items:', error)
        throw error
    }
}

async function getById(itemId, dbName) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
        const objId = toObjectId(itemId)
        const filter = objId ? { _id: objId } : { _id: itemId }
        return collection.findOne(filter)
    } catch (error) {
        console.error('[ItemModel] Error getting item by id:', error)
        throw error
    }
}

async function create(itemData, dbName) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
        const now = Date.now()

        const itemToAdd = {
            name: itemData.name || '',
            nameEn: itemData.nameEn || itemData.name || '',
            description: itemData.description || '',
            supplier: itemData.supplier || '',
            // Bottle/container volume in millilitres. Groundwork for deducting stock
            // from external sales data; nothing computes against it yet.
            volumeMl: itemData.volumeMl !== undefined ? Number(itemData.volumeMl) : 0,
            category: itemData.category || itemData.categoryId || '',
            imageUrl: itemData.imageUrl || '',
            isAvailable: itemData.isAvailable !== undefined ? itemData.isAvailable : true,
            stockQuantity: itemData.stockQuantity !== undefined ? itemData.stockQuantity : (itemData.quantity || 0),
            minStockLevel: itemData.minStockLevel !== undefined ? itemData.minStockLevel : 0,
            optimalStockLevel: itemData.optimalStockLevel !== undefined ? Number(itemData.optimalStockLevel) : 0,
            tags: itemData.tags || [],
            quantity: itemData.quantity !== undefined ? itemData.quantity : null,
            createdAt: now,
            updatedAt: now
        }

        const result = await collection.insertOne(itemToAdd)
        itemToAdd._id = result.insertedId
        return itemToAdd
    } catch (error) {
        console.error('[ItemModel] Error creating item:', error)
        throw error
    }
}

async function update(itemId, updateData, dbName) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
        const objId = toObjectId(itemId)
        const filter = objId ? { _id: objId } : { _id: itemId }

        const dataToUpdate = {
            name: updateData.name,
            nameEn: updateData.nameEn || updateData.name,
            description: updateData.description || '',
            supplier: updateData.supplier || '',
            volumeMl: updateData.volumeMl !== undefined ? Number(updateData.volumeMl) : 0,
            category: updateData.category || updateData.categoryId || '',
            imageUrl: updateData.imageUrl || '',
            isAvailable: updateData.isAvailable !== undefined ? updateData.isAvailable : true,
            stockQuantity: updateData.stockQuantity !== undefined ? updateData.stockQuantity : 0,
            minStockLevel: updateData.minStockLevel !== undefined ? updateData.minStockLevel : 0,
            tags: updateData.tags || [],
            quantity: updateData.quantity !== undefined ? updateData.quantity : null,
            updatedAt: Date.now()
        }

        if (updateData.optimalStockLevel !== undefined) {
            dataToUpdate.optimalStockLevel = Number(updateData.optimalStockLevel)
        }

        const result = await collection.updateOne(filter, { $set: dataToUpdate })
        if (result.matchedCount === 0) return null
        return getById(itemId, dbName)
    } catch (error) {
        console.error('[ItemModel] Error updating item:', error)
        throw error
    }
}

async function updateStock(itemId, quantity, dbName) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
        const objId = toObjectId(itemId)
        const filter = objId ? { _id: objId } : { _id: itemId }

        const result = await collection.updateOne(filter, {
            $set: { stockQuantity: quantity, updatedAt: Date.now() }
        })
        if (result.matchedCount === 0) return null
        return getById(itemId, dbName)
    } catch (error) {
        console.error('[ItemModel] Error updating stock:', error)
        throw error
    }
}

async function remove(itemId, dbName) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
        const objId = toObjectId(itemId)
        const filter = objId ? { _id: objId } : { _id: itemId }
        const result = await collection.deleteOne(filter)
        return result.deletedCount
    } catch (error) {
        console.error('[ItemModel] Error removing item:', error)
        throw error
    }
}
