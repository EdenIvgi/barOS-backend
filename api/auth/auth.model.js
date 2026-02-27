import { dbService } from '../../services/mongo.service.js'
import bcrypt from 'bcrypt'

const COLLECTION_NAME = 'user'

export const authModel = {
    getByUsername,
    create
}

async function getByUsername(username) {
    try {
        const collection = await dbService.getMasterCollection(COLLECTION_NAME)
        const user = await collection.findOne({ username })
        return user
    } catch (error) {
        console.error('[AuthModel] Error getting user by username:', error)
        throw error
    }
}

async function create(userData) {
    try {
        const collection = await dbService.getMasterCollection(COLLECTION_NAME)

        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds)

        const VALID_ROLES = ['admin', 'manager', 'bartender']
        const role = VALID_ROLES.includes(userData.role) ? userData.role : 'admin'

        const userToAdd = {
            username: userData.username,
            password: hashedPassword,
            fullname: userData.fullname || userData.username,
            role,
            createdAt: Date.now()
        }

        const result = await collection.insertOne(userToAdd)
        userToAdd._id = result.insertedId

        // barId = user's own _id (each signup creates an independent bar)
        const barId = result.insertedId.toString()
        userToAdd.barId = barId

        await collection.updateOne(
            { _id: result.insertedId },
            { $set: { barId } }
        )

        delete userToAdd.password

        return userToAdd
    } catch (error) {
        console.error('[AuthModel] Error creating user:', error)
        throw error
    }
}
