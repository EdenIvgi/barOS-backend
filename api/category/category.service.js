import { categoryModel } from './category.model.js'

export const categoryService = {
    query,
    getById,
    add,
    update,
    remove
}

// Helper function to convert ObjectId to string
function serializeCategory(category) {
    if (!category) return category
    const serialized = { ...category }
    // Convert _id to string if it's an ObjectId
    if (serialized._id) {
        serialized._id = serialized._id.toString()
    }
    return serialized
}

async function query() {
    try {
        const categories = await categoryModel.getAll()
        // Serialize all categories to convert ObjectIds to strings
        return categories.map(serializeCategory)
    } catch (error) {
        console.error('[CategoryService] Error in query:', error)
        throw error
    }
}

async function getById(categoryId) {
    try {
        const category = await categoryModel.getById(categoryId)
        return serializeCategory(category)
    } catch (error) {
        console.error('[CategoryService] Error in getById:', error)
        throw error
    }
}

async function add(category) {
    try {
        const addedCategory = await categoryModel.create(category)
        return serializeCategory(addedCategory)
    } catch (error) {
        console.error('[CategoryService] Error in add:', error)
        throw error
    }
}

async function update(categoryId, category) {
    try {
        const updatedCategory = await categoryModel.update(categoryId, category)
        return serializeCategory(updatedCategory)
    } catch (error) {
        console.error('[CategoryService] Error in update:', error)
        throw error
    }
}

async function remove(categoryId) {
    try {
        const deletedCount = await categoryModel.remove(categoryId)
        return deletedCount
    } catch (error) {
        console.error('[CategoryService] Error in remove:', error)
        throw error
    }
}
