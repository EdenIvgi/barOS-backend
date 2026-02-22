/**
 * Recursively converts MongoDB ObjectId fields to strings in a document.
 * Handles _id at the top level and one level of nesting for embedded objects.
 */
export function serializeDoc(doc) {
    if (!doc) return doc
    const out = { ...doc }
    for (const key of Object.keys(out)) {
        const val = out[key]
        if (val && typeof val === 'object' && typeof val.toString === 'function' && val._bsontype === 'ObjectId') {
            out[key] = val.toString()
        } else if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
            out[key] = serializeDoc(val)
        }
    }
    return out
}
