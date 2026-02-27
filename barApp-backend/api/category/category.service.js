import { categoryModel } from './category.model.js'
import { serializeDoc } from '../../services/serialize.service.js'

export const categoryService = {
    query,
    getById,
    add,
    update,
    remove
}

async function query(dbName) {
    try {
        const categories = await categoryModel.getAll(dbName)
        return categories.map(serializeDoc)
    } catch (error) {
        console.error('[CategoryService] Error in query:', error)
        throw error
    }
}

async function getById(categoryId, dbName) {
    try {
        const category = await categoryModel.getById(categoryId, dbName)
        return serializeDoc(category)
    } catch (error) {
        console.error('[CategoryService] Error in getById:', error)
        throw error
    }
}

async function add(category, dbName) {
    try {
        const addedCategory = await categoryModel.create(category, dbName)
        return serializeDoc(addedCategory)
    } catch (error) {
        console.error('[CategoryService] Error in add:', error)
        throw error
    }
}

async function update(categoryId, category, dbName) {
    try {
        const updatedCategory = await categoryModel.update(categoryId, category, dbName)
        return serializeDoc(updatedCategory)
    } catch (error) {
        console.error('[CategoryService] Error in update:', error)
        throw error
    }
}

async function remove(categoryId, dbName) {
    try {
        const deletedCount = await categoryModel.remove(categoryId, dbName)
        return deletedCount
    } catch (error) {
        console.error('[CategoryService] Error in remove:', error)
        throw error
    }
}
