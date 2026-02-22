import { categoryModel } from './category.model.js'
import { serializeDoc } from '../../services/serialize.service.js'

export const categoryService = {
    query,
    getById,
    add,
    update,
    remove
}

async function query() {
    try {
        const categories = await categoryModel.getAll()
        return categories.map(serializeDoc)
    } catch (error) {
        console.error('[CategoryService] Error in query:', error)
        throw error
    }
}

async function getById(categoryId) {
    try {
        const category = await categoryModel.getById(categoryId)
        return serializeDoc(category)
    } catch (error) {
        console.error('[CategoryService] Error in getById:', error)
        throw error
    }
}

async function add(category) {
    try {
        const addedCategory = await categoryModel.create(category)
        return serializeDoc(addedCategory)
    } catch (error) {
        console.error('[CategoryService] Error in add:', error)
        throw error
    }
}

async function update(categoryId, category) {
    try {
        const updatedCategory = await categoryModel.update(categoryId, category)
        return serializeDoc(updatedCategory)
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
