import { itemModel } from './item.model.js'

export const itemService = {
    query,
    getById,
    add,
    update,
    remove,
    updateStock
}

// Helper function to convert ObjectId to string and preserve embedded category
function serializeItem(item) {
    if (!item) return item
    const serialized = { ...item }
    // Convert _id to string if it's an ObjectId
    if (serialized._id) {
        serialized._id = serialized._id.toString()
    }
    // Convert categoryId to string if it's an ObjectId
    if (serialized.categoryId) {
        serialized.categoryId = serialized.categoryId.toString()
    }
    // Serialize embedded category if it exists
    if (serialized.category) {
        if (serialized.category._id) {
            serialized.category._id = serialized.category._id.toString()
        }
    }
    return serialized
}

async function query(filterBy = {}) {
    try {
        const items = await itemModel.getAll(filterBy)
        // Serialize all items to convert ObjectIds to strings
        const serializedItems = items.map(serializeItem)
        // Return in format expected by frontend: { items: [], maxPage: 0 }
        // For now, we don't implement pagination, so maxPage is 0
        return { items: serializedItems, maxPage: 0 }
    } catch (error) {
        console.error('[ItemService] Error in query:', error)
        throw error
    }
}

async function getById(itemId) {
    try {
        const item = await itemModel.getById(itemId)
        return serializeItem(item)
    } catch (error) {
        console.error('[ItemService] Error in getById:', error)
        throw error
    }
}

async function add(item) {
    try {
        const addedItem = await itemModel.create(item)
        return serializeItem(addedItem)
    } catch (error) {
        console.error('[ItemService] Error in add:', error)
        throw error
    }
}

async function update(itemId, item) {
    try {
        const updatedItem = await itemModel.update(itemId, item)
        return serializeItem(updatedItem)
    } catch (error) {
        console.error('[ItemService] Error in update:', error)
        throw error
    }
}

async function remove(itemId) {
    try {
        const deletedCount = await itemModel.remove(itemId)
        return deletedCount
    } catch (error) {
        console.error('[ItemService] Error in remove:', error)
        throw error
    }
}

async function updateStock(itemId, quantity) {
    try {
        const updatedItem = await itemModel.updateStock(itemId, quantity)
        return serializeItem(updatedItem)
    } catch (error) {
        console.error('[ItemService] Error in updateStock:', error)
        throw error
    }
}
