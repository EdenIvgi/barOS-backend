import { ObjectId } from 'mongodb'

/**
 * Safely converts a string or ObjectId to a MongoDB ObjectId.
 * Returns null if the input is falsy or invalid.
 */
export function toObjectId(id) {
    if (!id) return null
    if (id instanceof ObjectId) return id
    try {
        return ObjectId.createFromHexString(String(id))
    } catch {
        return null
    }
}
