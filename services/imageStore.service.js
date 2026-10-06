import { GridFSBucket, ObjectId } from 'mongodb'
import { dbService } from './mongo.service.js'

const BUCKET = 'images'
const MAX_BYTES = 3 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp'])

/**
 * Photographs a bar takes of itself.
 *
 * The bytes live in GridFS inside the tenant's own database, which gives
 * isolation without any check of its own: an id belonging to another bar is
 * simply not in this bar's bucket. It also survives a redeploy, which the
 * server's filesystem does not — Render hands back a clean disk every time.
 *
 * The client downscales before uploading, but the limits below are enforced here
 * too. A browser is not something to take the word of.
 */
export const imageStore = { saveImage, openImage, deleteImages, MAX_BYTES, ALLOWED }

async function getBucket(dbName) {
    const db = await dbService.getDb(dbName)
    return new GridFSBucket(db, { bucketName: BUCKET })
}

/** Splits a data URL into its declared type and its bytes. */
function parseDataUrl(dataUrl) {
    const match = /^data:([a-z/+-]+);base64,(.+)$/i.exec(dataUrl || '')
    if (!match) {
        const err = new Error('Expected an image as a base64 data URL')
        err.status = 400
        throw err
    }
    const [, contentType, base64] = match
    if (!ALLOWED.has(contentType.toLowerCase())) {
        const err = new Error(`Unsupported image type: ${contentType}`)
        err.status = 415
        throw err
    }
    const buffer = Buffer.from(base64, 'base64')
    if (buffer.length === 0) {
        const err = new Error('Image is empty')
        err.status = 400
        throw err
    }
    if (buffer.length > MAX_BYTES) {
        const err = new Error('Image is too large')
        err.status = 413
        throw err
    }
    return { contentType: contentType.toLowerCase(), buffer }
}

async function saveImage(dbName, dataUrl) {
    const { contentType, buffer } = parseDataUrl(dataUrl)
    const bucket = await getBucket(dbName)

    const id = await new Promise((resolve, reject) => {
        const upload = bucket.openUploadStream(`image-${Date.now()}`, {
            contentType,
            metadata: { uploadedAt: Date.now() },
        })
        upload.on('error', reject)
        upload.on('finish', () => resolve(upload.id))
        upload.end(buffer)
    })

    return { id: id.toString(), contentType, size: buffer.length }
}

/** Returns a readable stream and its type, or null when there is no such image. */
async function openImage(dbName, id) {
    if (!ObjectId.isValid(id)) return null
    const objectId = new ObjectId(id)
    const bucket = await getBucket(dbName)

    const [file] = await bucket.find({ _id: objectId }).limit(1).toArray()
    if (!file) return null

    return {
        stream: bucket.openDownloadStream(objectId),
        contentType: file.contentType || 'application/octet-stream',
        size: file.length,
    }
}

/**
 * Removes images, ignoring ids that are already gone.
 *
 * Storage here is the database, so a file nothing points at is wasted quota
 * rather than a harmless leftover.
 */
async function deleteImages(dbName, ids = []) {
    const valid = [...new Set(ids)].filter(id => ObjectId.isValid(id))
    if (valid.length === 0) return 0

    const bucket = await getBucket(dbName)
    let removed = 0
    for (const id of valid) {
        try {
            await bucket.delete(new ObjectId(id))
            removed++
        } catch {
            // Already deleted, or never existed. Either way there is nothing to do.
        }
    }
    return removed
}
