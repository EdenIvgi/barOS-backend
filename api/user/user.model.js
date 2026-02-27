import { dbService } from '../../services/mongo.service.js'

const COLLECTION_NAME = 'user'

export const userModel = {
    getAll
}

async function getAll(filterBy = {}) {
    try {
        const collection = await dbService.getMasterCollection(COLLECTION_NAME)
        
        const criteria = {}
        if (filterBy.username) {
            criteria.username = filterBy.username
        }

        const users = await collection
            .find(criteria)
            .project({ password: 0 })
            .toArray()

        return users
    } catch (error) {
        console.error('[UserModel] Error getting users:', error)
        throw error
    }
}
