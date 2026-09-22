import { dbService } from '../../services/mongo.service.js'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

const COLLECTION_NAME = 'user'
const COMPANY_COLLECTION = 'company'

export const authModel = {
    getByUsername,
    create,
    updatePassword,
    getCompanyByDbName,
    ensureCompany,
    regenerateInviteCode
}

// Unambiguous alphabet: no O/0, I/1, so codes can be read aloud across a noisy bar.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateInviteCode() {
    const bytes = crypto.randomBytes(8)
    return Array.from(bytes, b => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
}

async function getCompanyByDbName(dbName) {
    const collection = await dbService.getMasterCollection(COMPANY_COLLECTION)
    return collection.findOne({ dbName })
}

/**
 * Fetch a company record, creating it if missing.
 * Companies that pre-date invite codes have no record yet, so their admin gets one
 * generated on first access rather than needing a separate migration.
 */
async function ensureCompany(dbName, companyDisplayName) {
    const collection = await dbService.getMasterCollection(COMPANY_COLLECTION)
    const existing = await collection.findOne({ dbName })
    if (existing) return existing

    const company = {
        dbName,
        companyDisplayName: companyDisplayName || dbName,
        inviteCode: generateInviteCode(),
        createdAt: Date.now(),
    }
    await collection.insertOne(company)
    return company
}

async function regenerateInviteCode(dbName) {
    const collection = await dbService.getMasterCollection(COMPANY_COLLECTION)
    const inviteCode = generateInviteCode()
    await collection.updateOne({ dbName }, { $set: { inviteCode, updatedAt: Date.now() } })
    return inviteCode
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

async function updatePassword(userId, hashedPassword) {
    try {
        const collection = await dbService.getMasterCollection(COLLECTION_NAME)
        await collection.updateOne({ _id: userId }, { $set: { password: hashedPassword } })
    } catch (error) {
        console.error('[AuthModel] Error updating password:', error)
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
        const companyDisplayName = rawCompanyName.trim()

        // Joining an existing company must be authorised by that company, otherwise
        // anyone who guesses a company name lands inside its database. The first user
        // creates the company and becomes its admin; everyone after needs its code.
        const existingCompanyUser = await collection.findOne({ dbName })
        let role = 'admin'

        if (existingCompanyUser) {
            const company = await ensureCompany(dbName, companyDisplayName)
            const supplied = (userData.inviteCode || '').trim().toUpperCase()
            if (!supplied || supplied !== company.inviteCode) {
                const err = new Error('This company name is taken. Ask its admin for an invite code to join.')
                err.status = 403
                throw err
            }
            role = 'bartender'
        } else {
            // New company — create its record now so the admin has an invite code to share.
            await ensureCompany(dbName, companyDisplayName)
        }

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
