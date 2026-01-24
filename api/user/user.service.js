import { userModel } from './user.model.js'

export const userService = {
    query,
    getById
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

async function getById(userId) {
    try {
        const user = await userModel.getById(userId)
        return user
    } catch (error) {
        console.error('[UserService] Error in getById:', error)
        throw error
    }
}
