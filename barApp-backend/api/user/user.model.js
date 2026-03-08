import { dbService } from '../../services/mongo.service.js'

const COLLECTION_NAME = 'user'

export const userModel = {
    getAll
}

async function getAll(filterBy = {}, dbName) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME, dbName)

        const criteria = {}
        if (filterBy.username) {
            criteria.username = filterBy.username
        }

        const users = await collection
            .find(criteria)
            .toArray()

        return users
    } catch (error) {
        console.error('[UserModel] Error getting users:', error)
        throw error
    }
}
