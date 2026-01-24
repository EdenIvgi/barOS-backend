import { authModel } from './auth.model.js'
import bcrypt from 'bcrypt'

export const authService = {
    login,
    signup,
    logout
}

async function login(username, password) {
    try {
        const user = await authModel.getByUsername(username)
        if (!user) {
            throw new Error('Invalid username or password')
        }

        const match = await bcrypt.compare(password, user.password)
        if (!match) {
            throw new Error('Invalid username or password')
        }

        delete user.password
        return user
    } catch (error) {
        console.error('[AuthService] Error in login:', error)
        throw error
    }
}

async function signup(userData) {
    try {
        const existingUser = await authModel.getByUsername(userData.username)
        if (existingUser) {
            throw new Error('Username already exists')
        }

        const user = await authModel.create(userData)
        return user
    } catch (error) {
        console.error('[AuthService] Error in signup:', error)
        throw error
    }
}

async function logout() {
    return Promise.resolve()
}
