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
  }
}

export const barBookModel = {
  get,
  save,
  clear,
}

/** מחזיר את תוכן ספר הבר היחיד (slug: default). אם אין – null. */
async function get() {
  const collection = await dbService.getCollection(COLLECTION_NAME)
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

/** שומר את כל תוכן ספר הבר. אם אין מסמך – יוצר; אחרת מעדכן. */
async function save(content) {
  const collection = await dbService.getCollection(COLLECTION_NAME)
  const { _id, createdAt, updatedAt, ...payload } = content || {}
  const now = Date.now()

  const dataToSave = {
    slug: DEFAULT_SLUG,
    checklists: payload.checklists ?? emptyContent().checklists,
    dailyTasks: Array.isArray(payload.dailyTasks) ? payload.dailyTasks : [],
    stockTable: payload.stockTable ?? emptyContent().stockTable,
    updatedAt: now,
  }

  const doc = await collection.findOne({ slug: DEFAULT_SLUG })
  if (doc) {
    await collection.updateOne(
      { slug: DEFAULT_SLUG },
      { $set: dataToSave }
    )
    return get()
  }

  dataToSave.createdAt = now
  await collection.insertOne(dataToSave)
  return get()
}

/** מנקה את התוכן – שומר מבנה ריק (אין דמו דאטה). */
async function clear() {
  return save(emptyContent())
}
