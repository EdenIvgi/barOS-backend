import { dbService } from '../../services/mongo.service.js'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcrypt'

const COLLECTION_NAME = 'user'

export const authModel = {
    getByUsername,
    create,
    update
}

async function getByUsername(username) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const user = await collection.findOne({ username })
        return user
    } catch (error) {
        console.error('[AuthModel] Error getting user by username:', error)
        throw error
    }
}

async function create(userData) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds)
        
        const userToAdd = {
            username: userData.username,
            password: hashedPassword,
            fullname: userData.fullname,
            createdAt: Date.now()
        }

        const result = await collection.insertOne(userToAdd)
        userToAdd._id = result.insertedId
        delete userToAdd.password // Don't return password

        return userToAdd
    } catch (error) {
        console.error('[AuthModel] Error creating user:', error)
        throw error
    }
}

async function update(userId, updateData) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        
        if (updateData.password) {
            const saltRounds = 10
            updateData.password = await bcrypt.hash(updateData.password, saltRounds)
        }
        
        const result = await collection.updateOne(
            { _id: ObjectId.createFromHexString(userId) },
            { $set: updateData }
        )
        
        return result.modifiedCount
    } catch (error) {
        console.error('[AuthModel] Error updating user:', error)
        throw error
    }
}
