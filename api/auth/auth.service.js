import { authModel } from './auth.model.js'
import bcrypt from 'bcrypt'
import { createError } from '../../middleware/error.middleware.js'
import { provisionUserDb } from '../../services/dbProvisioning.service.js'

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
    const existing = await authModel.getByUsername(userData.username)
    if (existing) throw createError('Username already exists', 409)

    const user = await authModel.create(userData)
    await provisionUserDb(user.barId)
    return user
}
