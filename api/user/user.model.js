import { dbService } from '../../services/mongo.service.js'

const COLLECTION_NAME = 'user'

// Safe fields to expose in API responses (exclude sensitive data)
const SAFE_USER_FIELDS = {
    _id: 1,
    username: 1,
    fullname: 1,
    role: 1,
    companyDisplayName: 1,
    createdAt: 1,
    updatedAt: 1
}

export const userModel = {
    getAll,
    getSafeUser
}

/**
 * Get users without exposing sensitive fields
 * SECURITY: Never expose password, dbName, companyName or other sensitive fields
 */
async function getAll(filterBy = {}, dbName) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME, dbName)

        const criteria = {}
        if (filterBy.username) {
            criteria.username = filterBy.username
        }

        const users = await collection
            .find(criteria)
            .project(SAFE_USER_FIELDS)
            .toArray()

        return users
    } catch (error) {
        console.error('[UserModel] Error getting users:', error)
        throw error
    }
}

/**
 * Helper function to filter sensitive data from a single user object
 */
function getSafeUser(user) {
    if (!user) return null

    const safeUser = {}
    for (const field of Object.keys(SAFE_USER_FIELDS)) {
        if (field in user) {
            safeUser[field] = user[field]
        }
    }
    return safeUser
}
