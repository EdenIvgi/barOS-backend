import { dbService } from '../../services/mongo.service.js'
import { toObjectId } from '../../services/objectId.service.js'

const COLLECTION_NAME = 'category'

export const categoryModel = {
    getAll,
    getById,
    create,
    update,
    remove
}

async function getAll(dbName) {
    const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
    return collection.find({ isActive: { $ne: false } })
        .sort({ order: 1, name: 1 })
        .toArray()
}

async function getById(categoryId, dbName) {
    const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
    const objId = toObjectId(categoryId)
    const filter = objId ? { _id: objId } : { _id: categoryId }
    return collection.findOne(filter)
}

async function create(categoryData, dbName) {
    const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
    const now = Date.now()

    const categoryToAdd = {
        name: categoryData.name || '',
        nameEn: categoryData.nameEn || categoryData.name || '',
        icon: categoryData.icon || '',
        order: categoryData.order !== undefined ? categoryData.order : 0,
        isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
        createdAt: now,
        updatedAt: now
    }

    const result = await collection.insertOne(categoryToAdd)
    categoryToAdd._id = result.insertedId
    return categoryToAdd
}

async function update(categoryId, updateData, dbName) {
    const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
    const objId = toObjectId(categoryId)
    const filter = objId ? { _id: objId } : { _id: categoryId }

    const dataToUpdate = {
        name: updateData.name,
        nameEn: updateData.nameEn || updateData.name,
        icon: updateData.icon || '',
        order: updateData.order !== undefined ? updateData.order : 0,
        isActive: updateData.isActive !== undefined ? updateData.isActive : true,
        updatedAt: Date.now()
    }

    const result = await collection.updateOne(filter, { $set: dataToUpdate })
    if (result.matchedCount === 0) return null
    return getById(categoryId, dbName)
}

async function remove(categoryId, dbName) {
    const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
    const objId = toObjectId(categoryId)
    const filter = objId ? { _id: objId } : { _id: categoryId }
    const result = await collection.deleteOne(filter)
    return result.deletedCount
}
