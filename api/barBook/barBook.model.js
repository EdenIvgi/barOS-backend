import { dbService } from '../../services/mongo.service.js'

const COLLECTION_NAME = 'barBook'
const DEFAULT_SLUG = 'default'

function emptyContent() {
  return {
    checklists: {
      opening: { title: '', items: [] },
      closing: { title: '', items: [] },
      deep: { title: '', items: [] },
    },
    dailyTasks: [],
    stockTable: { title: '', headers: [], rows: [] },
    recipes: [],
  }
}

export const barBookModel = {
  get,
  save,
  clear,
}

/** Returns the single bar book document (slug: default), or null if none. */
async function get(dbName) {
  const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
  const doc = await collection.findOne({ slug: DEFAULT_SLUG })
  if (!doc) return null
  const { _id, slug, createdAt, updatedAt, ...content } = doc
  return {
    _id: doc._id?.toString?.(),
    ...content,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

/** Saves full bar book content; creates document if missing, otherwise updates. */
async function save(content, dbName) {
  const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
  const { _id, createdAt, updatedAt, ...payload } = content || {}
  const now = Date.now()

  const dataToSave = {
    slug: DEFAULT_SLUG,
    checklists: payload.checklists ?? emptyContent().checklists,
    dailyTasks: Array.isArray(payload.dailyTasks) ? payload.dailyTasks : [],
    stockTable: payload.stockTable ?? emptyContent().stockTable,
    recipes: Array.isArray(payload.recipes) ? payload.recipes : [],
    updatedAt: now,
  }

  const doc = await collection.findOne({ slug: DEFAULT_SLUG })
  if (doc) {
    await collection.updateOne(
      { slug: DEFAULT_SLUG },
      { $set: dataToSave }
    )
    return get(dbName)
  }

  dataToSave.createdAt = now
  await collection.insertOne(dataToSave)
  return get(dbName)
}

/** Clears content to empty structure (no demo data). */
async function clear(dbName) {
  return save(emptyContent(), dbName)
}
