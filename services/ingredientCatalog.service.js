import { INGREDIENTS } from '../data/ingredients.mjs'

/**
 * The vocabulary that connects a shelf to a recipe.
 *
 * A recipe asks for gin. A bar owns Tanqueray. Nothing in either string says so,
 * which is why "what can I make tonight" needs a layer like this one: every
 * product resolves to a canonical ingredient, every recipe line points at one,
 * and the question becomes whether one set contains another.
 *
 * Matching runs in memory off a prepared index - it is called for every product
 * on every availability check, so it must not touch the database.
 */

const UNIT_ALIASES = {
    ml: 'ml', cl: 'cl', oz: 'oz', g: 'g',
    dash: 'dash', drop: 'drop', tsp: 'tsp', tbsp: 'tbsp',
    leaf: 'leaf', sprig: 'sprig', piece: 'piece', slice: 'slice',
    rim: 'rim', pinch: 'pinch', wedge: 'wedge',
}

/**
 * Folds away everything two spellings of the same word can differ by: case, the
 * three apostrophes Hebrew uses interchangeably, punctuation and extra spaces.
 */
export function normalise(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[׳‘’'`´]/g, '')
        .replace(/[״“”"]/g, '')
        .replace(/[^\p{Letter}\p{Number}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

const BY_SLUG = new Map(INGREDIENTS.map(ing => [ing.slug, ing]))

// One alias can only mean one ingredient; the first entry to claim it keeps it,
// so the list's own order is the tie-breaker rather than something invisible.
const BY_ALIAS = new Map()
for (const ing of INGREDIENTS) {
    for (const alias of [ing.slug, ing.he, ing.en, ...(ing.aliases || [])]) {
        const key = normalise(alias)
        if (key && !BY_ALIAS.has(key)) BY_ALIAS.set(key, ing.slug)
    }
}

// Longest first: "ג׳ין" must not win over "bombay sapphire" inside one name.
const ALIAS_KEYS = [...BY_ALIAS.keys()].sort((a, b) => b.length - a.length)

export const ingredientCatalog = {
    all: () => INGREDIENTS,
    get: slug => BY_SLUG.get(slug) || null,
    has: slug => BY_SLUG.has(slug),
    match,
    matchItem,
    parseLine,
    normalise,
}

/**
 * The ingredient a piece of text refers to, or null.
 *
 * An exact name wins outright. Failing that a known alias appearing inside the
 * text is taken, which is what catches "Absolut Vodka 700ml" and "ג׳ין טנקרי".
 */
export function match(text) {
    const key = normalise(text)
    if (!key) return null

    const exact = BY_ALIAS.get(key)
    if (exact) return exact

    for (const alias of ALIAS_KEYS) {
        // Word boundaries, so "gin" does not match inside "ginger".
        if (key === alias) return BY_ALIAS.get(alias)
        if (new RegExp(`(^|\\s)${escapeRegExp(alias)}($|\\s)`).test(key)) {
            return BY_ALIAS.get(alias)
        }
    }
    return null
}

function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * What a product on the shelf counts as.
 *
 * A mapping someone set by hand is the answer, full stop - it is the only one a
 * person actually chose. Otherwise the name is tried, then the category, which
 * is how a bar that sorts its products sensibly gets most of this for free.
 */
export function matchItem(item) {
    if (item?.ingredientId && BY_SLUG.has(item.ingredientId)) return item.ingredientId
    return match(item?.name)
        || match(item?.nameEn)
        || match(typeof item?.category === 'string' ? item.category : item?.category?.name)
        || null
}

/**
 * Reads one line of a library recipe: "gin 60", "angostura 2 dash", "mint 8 leaf",
 * "egg_white 1 piece ?" (optional), "orange_peel 1 piece *" (garnish).
 *
 * Returns null for a line naming an ingredient the catalogue does not have, so a
 * typo in the library becomes a missing line rather than an unmatchable recipe.
 */
export function parseLine(line) {
    const parts = String(line || '').trim().split(/\s+/)
    if (!parts.length) return null

    let isOptional = false
    let isGarnish = false
    while (parts.length && (parts[parts.length - 1] === '?' || parts[parts.length - 1] === '*')) {
        if (parts.pop() === '?') isOptional = true
        else isGarnish = true
    }

    const [slug, rawAmount, rawUnit] = parts
    if (!BY_SLUG.has(slug)) return null

    const amount = Number(rawAmount)
    return {
        ingredientId: slug,
        amount: Number.isFinite(amount) && amount > 0 ? amount : null,
        unit: UNIT_ALIASES[rawUnit] || 'ml',
        isOptional,
        isGarnish,
    }
}
