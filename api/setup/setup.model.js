import { dbService } from '../../services/mongo.service.js'

const COLLECTION_NAME = 'setup'

/**
 * Whether this bar has been through the account setup flow.
 *
 * One document per bar rather than per user: it is the bar that gets set up, so
 * an admin who finishes has finished it for the company, not just for themselves.
 * Lives in the tenant database alongside barBook, which the auth middleware
 * already scopes.
 */
const STEPS = ['book', 'suppliers', 'products', 'team']

function emptySetup() {
    return {
        status: 'pending',
        steps: Object.fromEntries(STEPS.map(s => [s, false])),
        updatedAt: Date.now(),
    }
}

async function get(dbName) {
    const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
    const doc = await collection.findOne({})
    if (!doc) return emptySetup()

    const { _id, ...rest } = doc
    // Fill in steps added after this bar's document was written, so a new step
    // does not read as undefined.
    const steps = Object.fromEntries(STEPS.map(s => [s, !!rest.steps?.[s]]))
    return { ...rest, status: rest.status === 'done' ? 'done' : 'pending', steps }
}

async function save(patch, dbName) {
    const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
    const current = await get(dbName)

    const steps = { ...current.steps }
    for (const step of STEPS) {
        if (patch?.steps && step in patch.steps) steps[step] = !!patch.steps[step]
    }

    // Honour whichever status was asked for. The route already restricts it to
    // 'pending' or 'done', and quietly keeping the old one meant a request to
    // reopen setup returned 200 while changing nothing.
    const status = patch?.status === 'done' || patch?.status === 'pending'
        ? patch.status
        : current.status

    const next = {
        status,
        steps,
        updatedAt: Date.now(),
    }

    await collection.updateOne({}, { $set: next }, { upsert: true })
    return next
}

export const setupModel = { get, save, STEPS }
