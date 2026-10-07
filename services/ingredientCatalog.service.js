import { INGREDIENTS } from '../data/ingredients.mjs'

/**
 * The vocabulary that connects a shelf to a recipe.
 *
 * A recipe asks for gin. A bar owns Tanqueray. Nothing in either string says so,
 * which is why "what can I make tonight" needs a layer like this one: every
 * product resolves to a canonical ingredient, every recipe line points at one,
 * and the question becomes whether one set contains another.
 *
 * The shared list below covers what most bars pour, and no list ever covers one
 * bar's falernum or its own date syrup - so a catalogue is an index built from
 * the shared ingredients plus whatever that bar added. Building one is pure and
 * cheap; `barCatalog.service.js` is what caches them per tenant.
 *
 * Matching runs entirely in memory. It is called for every product on every
 * availability check and must never touch the database.
 */

const UNIT_ALIASES = {
    ml: 'ml', cl: 'cl', oz: 'oz', g: 'g',
    dash: 'dash', drop: 'drop', tsp: 'tsp', tbsp: 'tbsp',
    leaf: 'leaf', sprig: 'sprig', piece: 'piece', slice: 'slice',
    rim: 'rim', pinch: 'pinch', wedge: 'wedge',
}

// Hebrew unit words people write by hand, folded to the unit they mean. Both
// spellings of the ml abbreviation are listed because keyboards produce either
// a straight quote or the Hebrew gershayim.
const HEBREW_UNITS = { 'מ"ל': 'ml', 'מ״ל': 'ml', 'גרם': 'g' }

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

function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Builds a matcher over one list of ingredients.
 *
 * A bar's own entries are passed after the shared ones, so a bar can add to the
 * vocabulary but cannot quietly redefine what "gin" means for its recipes: the
 * first entry to claim an alias keeps it.
 */
export function createCatalog(ingredients) {
    const bySlug = new Map()
    const byAlias = new Map()

    for (const ing of ingredients) {
        if (!ing?.slug || bySlug.has(ing.slug)) continue
        bySlug.set(ing.slug, ing)
        for (const alias of [ing.slug, ing.he, ing.en, ...(ing.aliases || [])]) {
            const key = normalise(alias)
            if (key && !byAlias.has(key)) byAlias.set(key, ing.slug)
        }
    }

    // Longest first: "ג׳ין" must not win over "bombay sapphire" inside one name.
    const aliasKeys = [...byAlias.keys()].sort((a, b) => b.length - a.length)

    /**
     * The ingredient a piece of text refers to, or null.
     *
     * An exact name wins outright. Failing that a known alias appearing inside the
     * text is taken, which is what catches "Absolut Vodka 700ml" and "ג׳ין טנקרי".
     */
    function match(text) {
        const key = normalise(text)
        if (!key) return null

        const exact = byAlias.get(key)
        if (exact) return exact

        for (const alias of aliasKeys) {
            // Word boundaries, so "gin" does not match inside "ginger".
            if (new RegExp(`(^|\\s)${escapeRegExp(alias)}($|\\s)`).test(key)) {
                return byAlias.get(alias)
            }
        }
        return null
    }

    /**
     * What a product on the shelf counts as.
     *
     * A mapping someone set by hand is the answer, full stop - it is the only one a
     * person actually chose. Otherwise the name is tried, then the category, which
     * is how a bar that sorts its products sensibly gets most of this for free.
     */
    function matchItem(item) {
        if (item?.ingredientId && bySlug.has(item.ingredientId)) return item.ingredientId
        return match(item?.name)
            || match(item?.nameEn)
            || match(typeof item?.category === 'string' ? item.category : item?.category?.name)
            || null
    }

    /**
     * Reads one line of a library recipe: "gin 60", "angostura 2 dash",
     * "mint 8 leaf", "egg_white 1 piece ?" (optional), "orange_peel 1 piece *"
     * (garnish).
     *
     * Returns null for a line naming an ingredient the catalogue does not have, so
     * a typo in the library becomes a missing line rather than a broken recipe.
     */
    function parseLine(line) {
        const parts = String(line || '').trim().split(/\s+/)
        if (!parts.length) return null

        let isOptional = false
        let isGarnish = false
        while (parts.length && (parts[parts.length - 1] === '?' || parts[parts.length - 1] === '*')) {
            if (parts.pop() === '?') isOptional = true
            else isGarnish = true
        }

        const [slug, rawAmount, rawUnit] = parts
        if (!bySlug.has(slug)) return null

        const amount = Number(rawAmount)
        return {
            ingredientId: slug,
            amount: Number.isFinite(amount) && amount > 0 ? amount : null,
            unit: UNIT_ALIASES[rawUnit] || 'ml',
            isOptional,
            isGarnish,
        }
    }

    /**
     * Reads one line a person wrote: "60 ml gin", "2,5 ml absinthe", "60 מ״ל ג׳ין".
     *
     * The first number is the amount, unit words are recognised by token (a word
     * boundary regex does not work on Hebrew), and what remains is the name. An
     * unmatched name is kept as rawText so nothing a person typed is lost.
     * Returns null only for a blank line.
     */
    function parseFreeText(line) {
        const text = String(line || '').trim()
        if (!text) return null

        let amount = null
        let rest = text
        const amountMatch = text.match(/\d+(?:[.,]\d+)?/)
        if (amountMatch) {
            const value = Number(amountMatch[0].replace(',', '.'))
            amount = Number.isFinite(value) ? value : null
            rest = text.replace(amountMatch[0], ' ')
        }

        let unit = ''
        const nameTokens = []
        for (const token of rest.split(/\s+/).filter(Boolean)) {
            const key = token.toLowerCase()
            const found = UNIT_ALIASES[key] || HEBREW_UNITS[token]
            if (found) unit ||= found
            else nameTokens.push(token)
        }

        const rawText = nameTokens.join(' ') || text
        return {
            ingredientId: nameTokens.length ? match(rawText) || '' : '',
            rawText,
            amount,
            unit: unit || 'ml',
            isOptional: false,
            isGarnish: false,
        }
    }

    return {
        all: () => [...bySlug.values()],
        get: slug => bySlug.get(slug) || null,
        has: slug => bySlug.has(slug),
        match,
        matchItem,
        parseLine,
        parseFreeText,
        normalise,
    }
}

/**
 * The shared catalogue alone.
 *
 * Used where there is no tenant to speak of - seeding the shared library, and
 * reading the units a line can be written in.
 */
export const ingredientCatalog = createCatalog(INGREDIENTS)

export const SHARED_INGREDIENTS = INGREDIENTS
export const UNITS = Object.keys(UNIT_ALIASES)
