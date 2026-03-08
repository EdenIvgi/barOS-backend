import { dbService } from '../../services/mongo.service.js'
import bcrypt from 'bcrypt'

const COLLECTION_NAME = 'user'

export const authModel = {
    getByUsername,
    create
}

/**
 * Sanitise a company name into a valid MongoDB database name segment.
 * Rules: lowercase, spaces → underscores, strip non-alphanumeric-underscore,
 *        strip leading/trailing underscores, max 40 chars.
 * Returns null if the result is empty after sanitisation.
 */
function sanitizeDbSegment(name) {
    if (!name || !name.trim()) return null
    const sanitized = name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')           // spaces → underscores
        .replace(/[^a-z0-9_]/g, '')     // remove anything else
        .replace(/^_+|_+$/g, '')        // trim leading / trailing underscores
        .slice(0, 40)
    return sanitized || null
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

        // Company name is required
        const rawCompanyName = userData.companyName
        const companySegment = sanitizeDbSegment(rawCompanyName)
        if (!companySegment) {
            throw new Error('Company name is required')
        }

        const companyName = companySegment
        const dbName = `${companySegment}_db`

        // Check if this company already has users (first user = admin)
        const existingCompanyUser = await collection.findOne({ dbName })
        const role = existingCompanyUser ? 'bartender' : 'admin'

        const companyDisplayName = rawCompanyName.trim()

        const userToAdd = {
            username: userData.username,
            password: hashedPassword,
            fullname: userData.fullname || userData.username,
            role,
            companyName,
            companyDisplayName,
            dbName,
            createdAt: Date.now()
        }

        const result = await collection.insertOne(userToAdd)
        userToAdd._id = result.insertedId

        // Also store user (without password) in the company's own user collection
        const companyUserCollection = await dbService.getCollection(COLLECTION_NAME, dbName)
        await companyUserCollection.insertOne({
            _id: userToAdd._id,
            username: userToAdd.username,
            fullname: userToAdd.fullname,
            role: userToAdd.role,
            companyDisplayName,
            createdAt: userToAdd.createdAt
        })

        delete userToAdd.password
        return userToAdd
    } catch (error) {
        console.error('[AuthModel] Error creating user:', error)
        throw error
    }
}
