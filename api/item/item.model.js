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

async function _resolveCategory(identifier, categoryCollection) {
    if (!identifier) return null

    if (typeof identifier === 'object' || (typeof identifier === 'string' && identifier.length === 24)) {
        try {
            const oid = typeof identifier === 'string'
                ? ObjectId.createFromHexString(identifier)
                : identifier
            const cat = await categoryCollection.findOne({ _id: oid })
            if (cat) return cat
        } catch { /* not a valid ObjectId */ }
    }

    if (typeof identifier === 'string') {
        return (
            await categoryCollection.findOne({ name: identifier }) ||
            await categoryCollection.findOne({ nameEn: identifier })
        )
    }
    return null
}

function _embedCategory(item, category) {
    if (!category) return
    item.category = {
        _id: category._id,
        name: category.name,
        nameEn: category.nameEn,
        icon: category.icon || '',
        order: category.order || 0,
        isActive: category.isActive !== false,
    }
}

async function _populateCategory(item, categoryCollection) {
    const id = item.categoryId || item.category
    const cat = await _resolveCategory(id, categoryCollection)
    if (cat) _embedCategory(item, cat)
    return item
}

async function getAll(filterBy = {}) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const categoryCollection = await dbService.getCollection('category')

        const criteria = {}

        if (filterBy.txt) {
            criteria.$or = [
                { name: { $regex: filterBy.txt, $options: 'i' } },
                { nameEn: { $regex: filterBy.txt, $options: 'i' } },
                { description: { $regex: filterBy.txt, $options: 'i' } },
                { supplier: { $regex: filterBy.txt, $options: 'i' } }
            ]
        }

        if (filterBy.categoryId) {
            try {
                criteria.categoryId = ObjectId.createFromHexString(filterBy.categoryId)
            } catch {
                criteria.$or = [
                    { categoryId: filterBy.categoryId },
                    { category: filterBy.categoryId }
                ]
            }
        } else if (filterBy.category) {
            criteria.category = filterBy.category
        }

        if (filterBy.supplier) {
            criteria.supplier = filterBy.supplier
        }

        if (filterBy.isAvailable !== null && filterBy.isAvailable !== undefined) {
            criteria.isAvailable = filterBy.isAvailable === 'true' || filterBy.isAvailable === true
        }

        if (filterBy.minPrice || filterBy.maxPrice) {
            criteria.price = {}
            if (filterBy.minPrice) criteria.price.$gte = Number(filterBy.minPrice)
            if (filterBy.maxPrice) criteria.price.$lte = Number(filterBy.maxPrice)
        }

        const items = await collection.find(criteria).sort({ name: 1 }).toArray()
        return Promise.all(items.map(item => _populateCategory(item, categoryCollection)))
    } catch (error) {
        console.error('[ItemModel] Error getting items:', error)
        throw error
    }
}

async function getById(itemId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const categoryCollection = await dbService.getCollection('category')

        const objId = toObjectId(itemId)
        const item = await collection.findOne(objId ? { _id: objId } : { _id: itemId })
        if (!item) return null

        return _populateCategory(item, categoryCollection)
    } catch (error) {
        console.error('[ItemModel] Error getting item by id:', error)
        throw error
    }
}

async function create(itemData) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const categoryCollection = await dbService.getCollection('category')

        const itemToAdd = {
            name: itemData.name || '',
            nameEn: itemData.nameEn || itemData.name || '',
            description: itemData.description || '',
            supplier: itemData.supplier || '',
            price: itemData.price !== undefined ? Number(itemData.price) : 0,
            imageUrl: itemData.imageUrl || '',
            isAvailable: itemData.isAvailable !== undefined ? itemData.isAvailable : true,
            stockQuantity: itemData.stockQuantity !== undefined ? itemData.stockQuantity : (itemData.quantity || 0),
            minStockLevel: itemData.minStockLevel !== undefined ? itemData.minStockLevel : 0,
            optimalStockLevel: itemData.optimalStockLevel !== undefined ? Number(itemData.optimalStockLevel) : 0,
            tags: itemData.tags || [],
            quantity: itemData.quantity !== undefined ? itemData.quantity : null,
            createdAt: Date.now(),
            updatedAt: Date.now()
        }

        const identifier = itemData.categoryId || itemData.category
        const category = await _resolveCategory(identifier, categoryCollection)
        if (category) {
            itemToAdd.categoryId = category._id
            itemToAdd.category = category.name
        } else if (typeof identifier === 'string') {
            itemToAdd.category = identifier
        }

        const result = await collection.insertOne(itemToAdd)
        itemToAdd._id = result.insertedId

        if (category) _embedCategory(itemToAdd, category)

        return itemToAdd
    } catch (error) {
        console.error('[ItemModel] Error creating item:', error)
        throw error
    }
}

async function update(itemId, updateData) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)

        const itemToUpdate = {
            name: updateData.name,
            nameEn: updateData.nameEn || updateData.name,
            description: updateData.description || '',
            supplier: updateData.supplier || '',
            price: updateData.price !== undefined ? Number(updateData.price) : 0,
            imageUrl: updateData.imageUrl || '',
            isAvailable: updateData.isAvailable !== undefined ? updateData.isAvailable : true,
            stockQuantity: updateData.stockQuantity !== undefined ? updateData.stockQuantity : 0,
            minStockLevel: updateData.minStockLevel !== undefined ? updateData.minStockLevel : 0,
            tags: updateData.tags || [],
            quantity: updateData.quantity !== undefined ? updateData.quantity : null,
            updatedAt: Date.now()
        }
        // optimalStockLevel: only update when explicitly provided by user. Never overwrite from other sources.
        if (updateData.optimalStockLevel !== undefined) {
            itemToUpdate.optimalStockLevel = Number(updateData.optimalStockLevel)
        }

        // Handle categoryId (ObjectId) or category (string)
        if (updateData.categoryId) {
            try {
                itemToUpdate.categoryId = ObjectId.createFromHexString(updateData.categoryId)
                delete itemToUpdate.category // Remove category string if categoryId is set
            } catch (e) {
                itemToUpdate.category = updateData.categoryId
                delete itemToUpdate.categoryId
            }
        } else if (updateData.category) {
            itemToUpdate.category = updateData.category
            delete itemToUpdate.categoryId
        }

        const objId = toObjectId(itemId)
        const filter = objId ? { _id: objId } : { _id: itemId }
        const result = await collection.updateOne(filter, { $set: itemToUpdate })

        if (result.matchedCount === 0) return null
        return getById(itemId)
    } catch (error) {
        console.error('[ItemModel] Error updating item:', error)
        throw error
    }
}

async function updateStock(itemId, quantity) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const objId = toObjectId(itemId)
        const filter = objId ? { _id: objId } : { _id: itemId }
        const result = await collection.updateOne(filter, { $set: { stockQuantity: quantity, updatedAt: Date.now() } })
        if (result.matchedCount === 0) return null
        return getById(itemId)
    } catch (error) {
        console.error('[ItemModel] Error updating stock:', error)
        throw error
    }
}

async function remove(itemId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const objId = toObjectId(itemId)
        const filter = objId ? { _id: objId } : { _id: itemId }
        const result = await collection.deleteOne(filter)
        return result.deletedCount
    } catch (error) {
        console.error('[ItemModel] Error removing item:', error)
        throw error
    }
}
