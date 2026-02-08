import { itemModel } from './item.model.js'
import { dbService } from '../../services/mongo.service.js'
import { ObjectId } from 'mongodb'

export const itemService = {
    query,
    getById,
    add,
    update,
    remove,
    updateStock,
    importStock
}

// Helper function to convert ObjectId to string and preserve embedded category
function serializeItem(item) {
    if (!item) return item
    const serialized = { ...item }
    // Convert _id to string if it's an ObjectId
    if (serialized._id) {
        serialized._id = serialized._id.toString()
    }
    // Convert categoryId to string if it's an ObjectId
    if (serialized.categoryId) {
        serialized.categoryId = serialized.categoryId.toString()
    }
    // Serialize embedded category if it exists
    if (serialized.category) {
        if (serialized.category._id) {
            serialized.category._id = serialized.category._id.toString()
        }
    }
    return serialized
}

async function query(filterBy = {}) {
    try {
        const items = await itemModel.getAll(filterBy)
        // Serialize all items to convert ObjectIds to strings
        const serializedItems = items.map(serializeItem)
        // Return in format expected by frontend: { items: [], maxPage: 0 }
        // For now, we don't implement pagination, so maxPage is 0
        return { items: serializedItems, maxPage: 0 }
    } catch (error) {
        console.error('[ItemService] Error in query:', error)
        throw error
    }
}

async function getById(itemId) {
    try {
        const item = await itemModel.getById(itemId)
        return serializeItem(item)
    } catch (error) {
        console.error('[ItemService] Error in getById:', error)
        throw error
    }
}

async function add(item) {
    try {
        const addedItem = await itemModel.create(item)
        return serializeItem(addedItem)
    } catch (error) {
        console.error('[ItemService] Error in add:', error)
        throw error
    }
}

async function update(itemId, item) {
    try {
        const updatedItem = await itemModel.update(itemId, item)
        return serializeItem(updatedItem)
    } catch (error) {
        console.error('[ItemService] Error in update:', error)
        throw error
    }
}

async function remove(itemId) {
    try {
        const deletedCount = await itemModel.remove(itemId)
        return deletedCount
    } catch (error) {
        console.error('[ItemService] Error in remove:', error)
        throw error
    }
}

async function updateStock(itemId, quantity) {
    try {
        const updatedItem = await itemModel.updateStock(itemId, quantity)
        return serializeItem(updatedItem)
    } catch (error) {
        console.error('[ItemService] Error in updateStock:', error)
        throw error
    }
}

function normalizeName(input) {
    if (!input) return ''
    let s = String(input).trim()
    // Remove diacritics / nikud
    s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    s = s.replace(/[\u0591-\u05C7]/g, '')
    // Normalize Hebrew final letters
    const finalsMap = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' }
    s = s.replace(/[ךםןףץ]/g, ch => finalsMap[ch] || ch)
    // Normalize separators/punctuation
    s = s
        .toLowerCase()
        .replace(/[’'״"]/g, ' ')
        .replace(/[-_/\\.,:;(){}\[\]|+*?!]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    return s
}

function tokenize(norm) {
    if (!norm) return []
    return norm
        .split(' ')
        .map(t => t.trim())
        .filter(Boolean)
        .filter(t => t.length > 1)
}

function levenshteinDistance(a, b) {
    if (a === b) return 0
    const al = a.length
    const bl = b.length
    if (!al) return bl
    if (!bl) return al

    // DP with rolling array
    const prev = new Array(bl + 1)
    const curr = new Array(bl + 1)
    for (let j = 0; j <= bl; j++) prev[j] = j
    for (let i = 1; i <= al; i++) {
        curr[0] = i
        const ai = a.charCodeAt(i - 1)
        for (let j = 1; j <= bl; j++) {
            const cost = ai === b.charCodeAt(j - 1) ? 0 : 1
            curr[j] = Math.min(
                prev[j] + 1,
                curr[j - 1] + 1,
                prev[j - 1] + cost
            )
        }
        for (let j = 0; j <= bl; j++) prev[j] = curr[j]
    }
    return prev[bl]
}

function similarityScore(aRaw, bRaw) {
    const a = normalizeName(aRaw)
    const b = normalizeName(bRaw)
    if (!a || !b) return 0
    if (a === b) return 1
    if (a.includes(b) || b.includes(a)) return 0.92

    const aTokens = tokenize(a)
    const bTokens = tokenize(b)
    const aSet = new Set(aTokens)
    const bSet = new Set(bTokens)
    let inter = 0
    for (const t of aSet) if (bSet.has(t)) inter++
    const union = aSet.size + bSet.size - inter
    const jaccard = union ? inter / union : 0

    const maxLen = Math.max(a.length, b.length)
    const lev = maxLen <= 80 ? (1 - (levenshteinDistance(a, b) / maxLen)) : 0

    return 0.6 * jaccard + 0.4 * lev
}

async function importStock(rows, { dryRun = true, mode = 'set' } = {}) {
    const collection = await dbService.getCollection('items')
    const items = await collection
        .find({}, { projection: { name: 1, nameEn: 1, stockQuantity: 1, supplier: 1, category: 1 } })
        .toArray()

    // Build token index → candidate items
    const tokenIndex = new Map()
    const all = items.map(it => ({
        _id: it._id,
        idStr: it._id.toString(),
        name: it.name || '',
        nameEn: it.nameEn || '',
        stockQuantity: it.stockQuantity ?? 0,
        supplier: it.supplier || '',
        category: it.category || ''
    }))

    for (const it of all) {
        const names = [it.name, it.nameEn].filter(Boolean)
        const tokens = new Set()
        for (const n of names) {
            for (const t of tokenize(normalizeName(n))) tokens.add(t)
        }
        for (const t of tokens) {
            if (!tokenIndex.has(t)) tokenIndex.set(t, [])
            tokenIndex.get(t).push(it)
        }
    }

    const threshold = 0.72
    const matches = []
    const unmatched = []
    const seenByItemId = new Map() // itemIdStr → last row index

    rows.forEach((row, idx) => {
        const inputName = row?.name ?? row?.itemName ?? row?.title ?? ''
        const inputQtyRaw = row?.quantity ?? row?.stockQuantity ?? row?.stock ?? row?.qty
        const quantity = Number(inputQtyRaw)
        const inputSupplier = row?.supplier ? String(row.supplier).trim() : ''
        const inputCategory = row?.category ? String(row.category).trim() : ''
        // "כמה להזמין" from file - used to set optimalStockLevel so that (optimalStockLevel - stockQuantity) = this value
        const inputToOrder = row?.toOrder !== undefined && row?.toOrder !== null && row?.toOrder !== ''
            ? Number(row.toOrder)
            : (row?.toOrder === 0 ? 0 : 0)
        const toOrder = !isNaN(inputToOrder) ? Math.max(0, inputToOrder) : 0

        if (!inputName || Number.isNaN(quantity)) {
            unmatched.push({ rowIndex: idx, inputName, quantity: inputQtyRaw, reason: 'Missing name or quantity' })
            return
        }

        const qNorm = normalizeName(inputName)
        const qTokens = tokenize(qNorm)
        const candidateSet = new Map()
        for (const t of qTokens) {
            const bucket = tokenIndex.get(t)
            if (!bucket) continue
            for (const it of bucket) candidateSet.set(it.idStr, it)
        }
        const candidates = candidateSet.size ? Array.from(candidateSet.values()) : all

        let best = null
        let bestScore = 0
        for (const it of candidates) {
            const s1 = similarityScore(inputName, it.name)
            const s2 = it.nameEn ? similarityScore(inputName, it.nameEn) : 0
            let s = Math.max(s1, s2)

            // Boost score if supplier matches
            if (inputSupplier && it.supplier && normalizeName(inputSupplier) === normalizeName(it.supplier)) {
                s += 0.1
            }

            if (s > bestScore) {
                bestScore = s
                best = it
            }
        }

        if (!best || bestScore < threshold) {
            unmatched.push({ rowIndex: idx, inputName, quantity, bestGuess: best?.name || null, score: bestScore })
            return
        }

        const prevIdx = seenByItemId.get(best.idStr)
        if (prevIdx !== undefined) {
            // keep last, but report duplicate
            matches.push({
                rowIndex: idx,
                inputName,
                quantity,
                supplier: inputSupplier,
                category: inputCategory,
                toOrder,
                matchedItemId: best.idStr,
                matchedName: best.name,
                matchedNameEn: best.nameEn,
                score: bestScore,
                duplicateOfRowIndex: prevIdx
            })
        } else {
            matches.push({
                rowIndex: idx,
                inputName,
                quantity,
                supplier: inputSupplier,
                category: inputCategory,
                toOrder,
                matchedItemId: best.idStr,
                matchedName: best.name,
                matchedNameEn: best.nameEn,
                score: bestScore
            })
        }
        seenByItemId.set(best.idStr, idx)
    })

    // Deduplicate updates: take last quantity per item
    const updatesById = new Map()
    for (const m of matches) updatesById.set(m.matchedItemId, m)
    const updates = Array.from(updatesById.values())

    const summary = {
        totalRows: rows.length,
        matchedRows: matches.length,
        uniqueMatchedItems: updates.length,
        unmatchedRows: unmatched.length,
        dryRun: !!dryRun,
        mode
    }

    if (dryRun) return { summary, matches, unmatched }

    const bulkOps = updates.map(m => {
        const id = ObjectId.createFromHexString(m.matchedItemId)
        const newQty = Math.max(0, Number(m.quantity) || 0)
        const setFields = { updatedAt: Date.now() }
        const incFields = {}

        if (mode === 'add') {
            incFields.stockQuantity = newQty
        } else {
            setFields.stockQuantity = newQty
        }

        // "כמה להזמין" from file: set optimalStockLevel so that (optimalStockLevel - stockQuantity) = toOrder
        const toOrderFromFile = Number(m.toOrder)
        if (!isNaN(toOrderFromFile) && toOrderFromFile >= 0) {
            if (mode === 'set') {
                setFields.optimalStockLevel = newQty + toOrderFromFile
            }
        }

        // Update supplier if provided
        if (m.supplier) {
            setFields.supplier = m.supplier
        }

        // Update category if provided
        if (m.category) {
            setFields.category = m.category
        }

        const updateOp = {}
        if (Object.keys(incFields).length > 0) {
            updateOp.$inc = incFields
        }
        if (Object.keys(setFields).length > 0) {
            updateOp.$set = setFields
        }

        return {
            updateOne: {
                filter: { _id: id },
                update: updateOp
            }
        }
    })

    const bulkRes = bulkOps.length ? await collection.bulkWrite(bulkOps, { ordered: false }) : null
    return {
        summary: { ...summary, modifiedCount: bulkRes?.modifiedCount || 0, matchedCount: bulkRes?.matchedCount || 0 },
        matches,
        unmatched
    }
}
