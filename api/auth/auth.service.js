import { authModel } from './auth.model.js'
import bcrypt from 'bcrypt'
import { createError } from '../../middleware/error.middleware.js'

export const authService = {
    login,
    signup,
}

async function login(username, password) {
    const user = await authModel.getByUsername(username)
    if (!user) throw createError('Invalid username or password', 401)

    const match = await bcrypt.compare(password, user.password)
    if (!match) throw createError('Invalid username or password', 401)

    delete user.password
    return user
}

async function signup(userData) {
    if (!userData.companyName || !userData.companyName.trim()) {
        throw createError('Company name is required', 400)
    }

    const existing = await authModel.getByUsername(userData.username)
    if (existing) throw createError('Username already exists', 409)

    const user = await authModel.create(userData)
    return user
}
