import { userModel } from './user.model.js'

export const userService = {
    query
}

async function query(filterBy = {}) {
    try {
        const users = await userModel.getAll(filterBy)
        return users
    } catch (error) {
        console.error('[UserService] Error in query:', error)
        throw error
    }
}
