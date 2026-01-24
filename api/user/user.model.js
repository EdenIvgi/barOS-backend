import { dbService } from '../../services/mongo.service.js'
import { ObjectId } from 'mongodb'

const COLLECTION_NAME = 'user'

export const userModel = {
    getAll,
    getById
}

async function getAll(filterBy = {}) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        
        const criteria = {}
        if (filterBy.username) {
            criteria.username = filterBy.username
        }

        const users = await collection
            .find(criteria)
            .project({ password: 0 }) // Exclude password from results
            .toArray()

        return users
    } catch (error) {
        console.error('[UserModel] Error getting users:', error)
        throw error
    }
}

async function getById(userId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const user = await collection.findOne(
            { _id: ObjectId.createFromHexString(userId) },
            { projection: { password: 0 } }
        )
        return user
    } catch (error) {
        console.error('[UserModel] Error getting user by id:', error)
        throw error
    }
}
