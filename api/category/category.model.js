import { dbService } from '../../services/mongo.service.js'
import { ObjectId } from 'mongodb'

const COLLECTION_NAME = 'category'

export const categoryModel = {
    getAll,
    getById,
    create,
    update,
    remove
}

async function getAll() {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const categories = await collection
            .find({ isActive: { $ne: false } })
            .sort({ order: 1, name: 1 })
            .toArray()
        return categories
    } catch (error) {
        console.error('[CategoryModel] Error getting categories:', error)
        throw error
    }
}

async function getById(categoryId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        let category
        try {
            category = await collection.findOne({ _id: ObjectId.createFromHexString(categoryId) })
        } catch {
            category = await collection.findOne({ _id: categoryId })
        }
        return category
    } catch (error) {
        console.error('[CategoryModel] Error getting category by id:', error)
        throw error
    }
}

async function create(categoryData) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        
        const categoryToAdd = {
            name: categoryData.name || '',
            nameEn: categoryData.nameEn || categoryData.name || '',
            icon: categoryData.icon || '',
            order: categoryData.order !== undefined ? categoryData.order : 0,
            isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
            createdAt: Date.now(),
            updatedAt: Date.now()
        }

        const result = await collection.insertOne(categoryToAdd)
        categoryToAdd._id = result.insertedId

        return categoryToAdd
    } catch (error) {
        console.error('[CategoryModel] Error creating category:', error)
        throw error
    }
}

async function update(categoryId, updateData) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        
        const categoryToUpdate = {
            name: updateData.name,
            nameEn: updateData.nameEn || updateData.name,
            icon: updateData.icon || '',
            order: updateData.order !== undefined ? updateData.order : 0,
            isActive: updateData.isActive !== undefined ? updateData.isActive : true,
            updatedAt: Date.now()
        }

        let result
        try {
            result = await collection.updateOne(
                { _id: ObjectId.createFromHexString(categoryId) },
                { $set: categoryToUpdate }
            )
        } catch {
            result = await collection.updateOne(
                { _id: categoryId },
                { $set: categoryToUpdate }
            )
        }

        if (result.matchedCount === 0) {
            return null
        }

        return await getById(categoryId)
    } catch (error) {
        console.error('[CategoryModel] Error updating category:', error)
        throw error
    }
}

async function remove(categoryId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        let result
        try {
            result = await collection.deleteOne({ _id: ObjectId.createFromHexString(categoryId) })
        } catch {
            result = await collection.deleteOne({ _id: categoryId })
        }
        return result.deletedCount
    } catch (error) {
        console.error('[CategoryModel] Error removing category:', error)
        throw error
    }
}
