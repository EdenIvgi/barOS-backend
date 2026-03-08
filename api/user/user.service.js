import { userModel } from './user.model.js'

export const userService = {
    query
}

async function query(filterBy = {}, dbName) {
    try {
        const users = await userModel.getAll(filterBy, dbName)
        return users
    } catch (error) {
        console.error('[UserService] Error in query:', error)
        throw error
    }
}
