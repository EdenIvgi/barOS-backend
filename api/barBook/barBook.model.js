import { dbService } from '../../services/mongo.service.js'

const COLLECTION_NAME = 'barBook'

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

/** Returns the bar book content (single document in barBook collection) */
async function get(dbName) {
  const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
  const doc = await collection.findOne({})

  if (!doc) return { _id: 'barBook', ...emptyContent(), createdAt: Date.now(), updatedAt: Date.now() }

  const { _id, slug, ...content } = doc
  return {
    _id: _id?.toString?.() || 'barBook',
    ...emptyContent(),
    ...content,
  }
}

/** Saves full bar book content; creates document if missing, otherwise updates. */
async function save(content, dbName) {
  const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
  const { _id, createdAt, updatedAt, ...payload } = content || {}
  const now = Date.now()

  const dataToSave = {
    checklists: payload.checklists ?? emptyContent().checklists,
    dailyTasks: Array.isArray(payload.dailyTasks) ? payload.dailyTasks : [],
    stockTable: payload.stockTable ?? emptyContent().stockTable,
    recipes: Array.isArray(payload.recipes) ? payload.recipes : [],
    updatedAt: now,
  }

  const existing = await collection.findOne({})

  if (existing) {
    await collection.updateOne(
      { _id: existing._id },
      { $set: dataToSave }
    )
  } else {
    dataToSave.createdAt = now
    await collection.insertOne(dataToSave)
  }

  return get(dbName)
}

/** Clears content to empty structure. */
async function clear(dbName) {
  return save(emptyContent(), dbName)
}
