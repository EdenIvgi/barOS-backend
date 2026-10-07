import { dbService } from '../../services/mongo.service.js'
import { imageStore } from '../../services/imageStore.service.js'
import { recipeModel } from '../recipe/recipe.model.js'
import { barCatalog } from '../../services/barCatalog.service.js'

const COLLECTION_NAME = 'barBook'

export const barBookModel = { get, save, clear }

// ─── Migration: old fixed-schema → dynamic pages ───────
function migrateOldFormat(doc) {
  // Already in new format and has content — skip
  if (Array.isArray(doc.pages) && doc.pages.length > 0) return doc.pages

  const pages = []
  const ts = Date.now()

  // Checklists — merge all into a single 'checklists' page with sub-lists
  const checklistMap = { opening: 'פתיחה', closing: 'סגירה', deep: 'ניקיון עמוק' }
  const subLists = []
  for (const [key, fallbackTitle] of Object.entries(checklistMap)) {
    const list = doc.checklists?.[key]
    if (!list) continue
    const items = (list.items || []).filter(Boolean)
    if (!list.title && items.length === 0) continue
    subLists.push({
      _id: `migrated-${key}-${ts}`,
      title: list.title || fallbackTitle,
      items: items.map(text => ({ text: String(text), checked: false })),
    })
  }
  if (subLists.length > 0) {
    pages.push({ _id: `migrated-checklists-${ts}`, type: 'checklists', title: "צ'קליסטים", lists: subLists })
  }

  // Daily tasks
  if (Array.isArray(doc.dailyTasks) && doc.dailyTasks.length > 0) {
    pages.push({
      _id: `migrated-daily-${ts}`,
      type: 'daily',
      title: 'משימות יומיות',
      tasks: doc.dailyTasks.map(d => ({ day: d.day || '', task: d.task || '' })),
    })
  }

  // Stock table
  const st = doc.stockTable
  if (st && (st.headers?.length > 0 || st.rows?.length > 0)) {
    pages.push({
      _id: `migrated-stock-${ts}`,
      type: 'stock',
      title: st.title || 'מלאי',
      headers: st.headers || [],
      rows: st.rows || [],
    })
  }

  // Recipes
  if (Array.isArray(doc.recipes) && doc.recipes.length > 0) {
    pages.push({
      _id: `migrated-recipes-${ts}`,
      type: 'recipes',
      title: 'מתכונים',
      items: doc.recipes,
    })
  }

  return pages
}

/** A bilingual line reads as Hebrew first, the way the rest of the app does. */
function getLangText(line) {
  if (typeof line === 'string') return line
  return String(line?.he || line?.en || '')
}

function toRecipeDoc(item, catalog) {
  const lines = Array.isArray(item.ingredients) ? item.ingredients : []
  const steps = Array.isArray(item.instructions) ? item.instructions : []
  return {
    title: item.title,
    imageUrl: item.imageUrl,
    librarySlug: item.librarySlug,
    instructions: {
      he: steps.map(s => (typeof s === 'string' ? s : s?.he || '')),
      en: steps.map(s => (typeof s === 'string' ? '' : s?.en || '')),
    },
    ingredients: lines.map(line => catalog.parseFreeText(getLangText(line))).filter(Boolean),
  }
}

/**
 * Moves every `recipes` page into the recipes collection.
 *
 * Insert first, remove second: if the insert rejects the pages come back
 * untouched and the next read retries (createMany skips titles already held, so
 * a retry cannot duplicate). Callers must persist the result with a direct
 * update, never through save(), whose image garbage collection would delete the
 * photos this just carried over.
 */
async function migrateRecipePages(pages, dbName) {
  const recipePages = (pages || []).filter(p => p?.type === 'recipes')
  if (recipePages.length === 0) return { pages, changed: false }

  try {
    const catalog = await barCatalog.get(dbName)
    const docs = recipePages.flatMap(p => (p.items || []).map(item => toRecipeDoc(item, catalog)))
    if (docs.length > 0) await recipeModel.createMany(docs, dbName)
  } catch (err) {
    console.error('bar book recipe migration failed, will retry on next read', err?.message)
    return { pages, changed: false }
  }
  return { pages: pages.filter(p => p?.type !== 'recipes'), changed: true }
}

/**
 * Every image this book points at.
 *
 * Uploads live on gallery photos and on recipes. Any format may instead carry a
 * pasted external address, which is not ours to delete and is skipped by the id
 * match.
 *
 * Anything that gains an image has to be added here, or deleting it leaks the
 * file into the database for good.
 */
function collectImageIds(pages) {
  const ids = new Set()
  const ID_IN_URL = /^\/api\/image\/([a-f0-9]{24})$/i

  const add = imageUrl => {
    const match = ID_IN_URL.exec(imageUrl || '')
    if (match) ids.add(match[1])
  }

  for (const page of pages || []) {
    for (const photo of page.photos || []) add(photo.imageUrl)
    if (page.type === 'recipes') {
      for (const recipe of page.items || []) add(recipe.imageUrl)
    }
  }
  return ids
}

async function get(dbName) {
  const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
  const doc = await collection.findOne({})
  if (!doc) return { _id: 'barBook', pages: [], createdAt: Date.now(), updatedAt: Date.now() }

  const { _id, ...rest } = doc
  let pages = migrateOldFormat(rest)

  // Persist migration if old format (no pages field, or pages was empty but old data exists)
  const hasOldData = rest.checklists || rest.dailyTasks || rest.stockTable || rest.recipes
  const needsMigration = !Array.isArray(rest.pages) || (rest.pages.length === 0 && hasOldData)
  if (needsMigration && pages.length > 0) {
    await collection.updateOne({ _id }, { $set: { pages, updatedAt: Date.now() } })
  }

  const migrated = await migrateRecipePages(pages, dbName)
  if (migrated.changed) {
    pages = migrated.pages
    // Direct write on purpose: save() would garbage-collect the migrated photos.
    await collection.updateOne({ _id }, { $set: { pages, updatedAt: Date.now() } })
  }

  return { _id: _id?.toString?.() || 'barBook', ...rest, pages }
}

async function save(content, dbName) {
  const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
  const { _id, createdAt, updatedAt, baseUpdatedAt, ...payload } = content || {}
  const now = Date.now()

  const dataToSave = {
    pages: Array.isArray(payload.pages) ? payload.pages : [],
    updatedAt: now,
  }

  const existing = await collection.findOne({})

  // Storage here is the database, so a photo nothing points at is wasted quota.
  // The document being replaced is already in hand for the conflict check, and
  // the difference between the two is exactly what was removed.
  if (existing) {
    const before = collectImageIds(existing.pages)
    const after = collectImageIds(dataToSave.pages)
    const dropped = [...before].filter(id => !after.has(id))
    if (dropped.length > 0) {
      imageStore.deleteImages(dbName, dropped)
        .catch(err => console.error('failed to remove unused bar book images', err?.message))
    }
  }

  if (existing) {
    // Optimistic concurrency: this save replaces the whole document, so a client
    // working from a stale copy would silently wipe another user's edits.
    // baseUpdatedAt is the version the client loaded — refuse if it has moved on.
    if (baseUpdatedAt !== undefined && existing.updatedAt && baseUpdatedAt !== existing.updatedAt) {
      const err = new Error('Bar book was modified by someone else')
      err.status = 409
      throw err
    }
    await collection.updateOne({ _id: existing._id }, { $set: dataToSave })
  } else {
    dataToSave.createdAt = now
    await collection.insertOne(dataToSave)
  }

  return get(dbName)
}

async function clear(dbName) {
  return save({ pages: [] }, dbName)
}
