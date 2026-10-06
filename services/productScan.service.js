import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_CATEGORY_HINTS = 40

const CATEGORIES = [
    'wine', 'beer', 'spirits', 'liqueur', 'cocktail_mixer',
    'soft_drink', 'juice', 'water', 'energy_drink', 'coffee_tea', 'other_drink',
]

const SYSTEM_PROMPT = `You identify drink products from photographs for a bar's inventory system.

You only identify drinkable beverage products: bottles, cans, cartons, kegs and
boxes of wine, beer, spirits, liqueurs, mixers, soft drinks, juice, water, energy
drinks, and coffee or tea products.

Anything else - food, bar equipment, glassware, furniture, people, documents, a
pet, a car - is not a drink product. Say so by reporting isDrinkProduct as false
and leave the other fields empty. Never guess a drink from a photograph that does
not show one, and never describe what the photograph shows instead.

Read what is actually printed on the label. Do not invent a volume that is not
shown and is not the product's well-known standard size; report null instead.
Report your own confidence honestly: "low" when the label is unreadable or the
product is a guess from the bottle's shape alone.`

const TOOL = {
    name: 'record_product',
    description: 'Report the drink product shown in the photograph.',
    input_schema: {
        type: 'object',
        properties: {
            isDrinkProduct: {
                type: 'boolean',
                description: 'True only if the photograph shows a drinkable beverage product.',
            },
            name: {
                type: 'string',
                description: 'Product name in Hebrew, as an Israeli bar would write it. Empty if not a drink.',
            },
            nameEn: {
                type: 'string',
                description: 'Product name in English, as printed on the label. Empty if not a drink.',
            },
            brand: { type: 'string', description: 'Producer or brand name. Empty if unclear.' },
            category: {
                type: 'string',
                enum: CATEGORIES,
                description: 'The kind of drink.',
            },
            categoryLabel: {
                type: 'string',
                description: "The category in Hebrew. Reuse one of the bar's existing categories when one fits.",
            },
            volumeMl: {
                type: ['number', 'null'],
                description: 'Volume of one unit in millilitres. Null when it is not printed and not a standard size.',
            },
            abv: {
                type: ['number', 'null'],
                description: 'Alcohol by volume as a percentage. Null for non-alcoholic drinks or when not shown.',
            },
            confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        required: ['isDrinkProduct', 'confidence'],
    },
}

let client = null

export function isConfigured() {
    return Boolean(process.env.ANTHROPIC_API_KEY)
}

function getClient() {
    if (!isConfigured()) {
        const err = new Error('Product scanning is not configured on this server')
        err.status = 503
        throw err
    }
    if (!client) {
        client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
            // Only set when something other than the real API should answer, which
            // is how this path is exercised without spending on a live call.
            baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
        })
    }
    return client
}

/** Splits a data URL into its declared type and its base64 payload. */
function parseImage(dataUrl) {
    const match = /^data:([a-z/+-]+);base64,(.+)$/i.exec(dataUrl || '')
    if (!match) {
        const err = new Error('Expected an image as a base64 data URL')
        err.status = 400
        throw err
    }
    const [, rawType, base64] = match
    const contentType = rawType.toLowerCase()
    if (!ALLOWED.has(contentType)) {
        const err = new Error(`Unsupported image type: ${contentType}`)
        err.status = 415
        throw err
    }
    // Base64 carries about three bytes in every four characters.
    const bytes = Math.ceil(base64.length * 0.75)
    if (bytes > MAX_BYTES) {
        const err = new Error('Image is too large')
        err.status = 413
        throw err
    }
    return { contentType, base64 }
}

/**
 * The bar's own category names, so a scan lands in the vocabulary already in use
 * instead of inventing a synonym beside it.
 */
function categoryHint(knownCategories) {
    const names = (knownCategories || [])
        .filter(c => typeof c === 'string' && c.trim())
        .map(c => c.trim())
        .slice(0, MAX_CATEGORY_HINTS)
    if (!names.length) return ''
    return `\n\nThis bar already sorts its products into these categories: ${names.join(', ')}. Use one of them for categoryLabel when the product belongs to it.`
}

function pickToolResult(message) {
    const block = message?.content?.find(c => c.type === 'tool_use' && c.name === TOOL.name)
    return block?.input || null
}

function str(value) {
    return typeof value === 'string' ? value.trim() : ''
}

function positiveNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

/**
 * Returns the identified product, or throws with a status worth showing.
 * Nothing is written anywhere: the caller gives this to a form to confirm.
 */
async function scanProduct(dataUrl, knownCategories) {
    const { contentType, base64 } = parseImage(dataUrl)

    const message = await getClient().messages.create({
        model: MODEL,
        max_tokens: 400,
        system: SYSTEM_PROMPT + categoryHint(knownCategories),
        tools: [TOOL],
        // Forcing the tool is what makes the answer a record rather than prose:
        // there is no path where this returns a sentence the client has to parse.
        tool_choice: { type: 'tool', name: TOOL.name },
        messages: [{
            role: 'user',
            content: [
                { type: 'image', source: { type: 'base64', media_type: contentType, data: base64 } },
                { type: 'text', text: 'Identify this product.' },
            ],
        }],
    })

    const result = pickToolResult(message)
    if (!result) {
        const err = new Error('Could not read the product from this photograph')
        err.status = 502
        throw err
    }

    if (!result.isDrinkProduct) {
        const err = new Error('That is not a drink product')
        err.status = 422
        err.code = 'not_a_drink'
        throw err
    }

    return {
        name: str(result.name),
        nameEn: str(result.nameEn),
        brand: str(result.brand),
        category: str(result.category),
        categoryLabel: str(result.categoryLabel),
        volumeMl: positiveNumber(result.volumeMl),
        abv: positiveNumber(result.abv),
        confidence: ['low', 'medium', 'high'].includes(result.confidence) ? result.confidence : 'low',
    }
}

/**
 * Reading a bottle from a photograph.
 *
 * A bar counts hundreds of products and types every one of them in by hand. A
 * photograph of the label carries the name, the brand and the size already, so
 * this asks a vision model to read them off and hands the result to the form the
 * person was going to fill in anyway. It never saves anything: identification is
 * a guess, and a guess belongs in a field someone confirms, not in the stock.
 *
 * It answers about drinks and nothing else. That is enforced here rather than
 * only asked for in the prompt - the model reports whether what it saw is a
 * drink product, and anything else is refused before it reaches the caller.
 */
export const productScanService = { scanProduct, isConfigured, MAX_BYTES, ALLOWED }
