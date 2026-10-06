import Anthropic from '@anthropic-ai/sdk'
import { UNITS } from './ingredientCatalog.service.js'

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_CHARS = 20000
const MAX_RECIPES = 40
const MAX_CATALOGUE = 200

/**
 * Turning a pasted recipe into a record.
 *
 * Collecting recipes is typing, and typing is what stops a bar at twenty of them.
 * A manager pastes what they copied from wherever they keep it and this reads the
 * measures out of it, the way the product scanner reads a label.
 *
 * Nothing here writes. What comes back is a set of candidates for someone to
 * check, because a measure read wrongly is worse than one not read at all - it
 * looks like a recipe and pours like a mistake.
 *
 * Ingredients are mapped to the bar's catalogue by the model, and anything it
 * cannot place comes back as the raw text rather than a guess, so the review
 * screen can ask rather than the recipe quietly losing a line.
 */
export const recipeParseService = { parseRecipes, isConfigured, MAX_CHARS, MAX_RECIPES }

const TOOL = {
    name: 'record_recipes',
    description: 'Report the drink recipes found in the text.',
    input_schema: {
        type: 'object',
        properties: {
            recipes: {
                type: 'array',
                description: 'One entry per drink recipe found. Empty when the text holds none.',
                items: {
                    type: 'object',
                    properties: {
                        titleHe: { type: 'string', description: 'The drink name in Hebrew.' },
                        titleEn: { type: 'string', description: 'The drink name in English.' },
                        method: {
                            type: 'string',
                            enum: ['stirred', 'shaken', 'built', 'blended', 'prep', ''],
                            description: 'How it is made. "prep" for a syrup or other preparation.',
                        },
                        glass: { type: 'string', description: 'Serving glass, if the text says.' },
                        producesIngredientId: {
                            type: 'string',
                            description: 'For a syrup or cordial: the catalogue id of what it makes, if one fits. Empty otherwise.',
                        },
                        ingredients: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    ingredientId: {
                                        type: 'string',
                                        description: 'The catalogue id this line refers to. Empty when nothing in the catalogue fits.',
                                    },
                                    rawText: {
                                        type: 'string',
                                        description: 'The ingredient exactly as the text names it. Always filled.',
                                    },
                                    amount: { type: ['number', 'null'], description: 'Quantity, or null when none is given.' },
                                    unit: { type: 'string', enum: [...UNITS, ''], description: 'Unit of the quantity.' },
                                    isOptional: { type: 'boolean' },
                                    isGarnish: { type: 'boolean' },
                                },
                                required: ['rawText'],
                            },
                        },
                        stepsHe: { type: 'array', items: { type: 'string' }, description: 'Method steps in Hebrew.' },
                        stepsEn: { type: 'array', items: { type: 'string' }, description: 'Method steps in English.' },
                    },
                    required: ['titleHe', 'titleEn', 'ingredients'],
                },
            },
        },
        required: ['recipes'],
    },
}

const SYSTEM_PROMPT = `You read drink recipes out of text pasted by a bar manager and report them as records.

You handle drinks only: cocktails, mixed drinks, punches, shots, syrups, cordials,
infusions, and other bar preparations. Food recipes are not yours to report - if
the text is a food recipe, report no recipes at all rather than describing it.

Rules you do not break:

- Report only what the text says. Never invent a measure, a step or an ingredient
  that is not there. A recipe with no quantities comes back with null amounts.
- Several recipes in one block of text are several entries.
- Map every ingredient line to a catalogue id when one clearly fits, and leave
  ingredientId empty when none does. Never force a line onto a near-miss: an
  unmapped line is reviewed by a person, a wrong one is poured.
- rawText always holds the ingredient as the source wrote it, mapped or not.
- Fill both languages. Translate a name or a step into the other language when
  the text gives only one; keep the bar's own wording where it exists.
- A garnish is a garnish and an ingredient the text calls optional is optional.`

let client = null

export function isConfigured() {
    return Boolean(process.env.ANTHROPIC_API_KEY)
}

function getClient() {
    if (!isConfigured()) {
        const err = new Error('Recipe import is not configured on this server')
        err.status = 503
        throw err
    }
    if (!client) {
        client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
            baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
        })
    }
    return client
}

/** The catalogue as a list the model can map onto, kept short enough to send. */
function catalogueFor(catalog) {
    return catalog.all()
        .slice(0, MAX_CATALOGUE)
        .map(ing => `${ing.slug} = ${ing.he} / ${ing.en}`)
        .join('\n')
}

function str(value) {
    return typeof value === 'string' ? value.trim() : ''
}

function positiveNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

/** Shapes one reported recipe into what the review screen and the model expect. */
function toCandidate(raw, catalog) {
    const ingredients = (raw.ingredients || []).map(line => {
        const reported = str(line.ingredientId)
        // The model's mapping is checked against the catalogue rather than trusted:
        // an id that does not exist is the same as no mapping at all.
        const ingredientId = catalog.has(reported) ? reported : ''
        return {
            ingredientId,
            rawText: str(line.rawText),
            amount: positiveNumber(line.amount),
            unit: UNITS.includes(line.unit) ? line.unit : 'ml',
            isOptional: Boolean(line.isOptional),
            isGarnish: Boolean(line.isGarnish),
        }
    }).filter(line => line.rawText || line.ingredientId)

    const produces = str(raw.producesIngredientId)

    return {
        title: { he: str(raw.titleHe) || str(raw.titleEn), en: str(raw.titleEn) || str(raw.titleHe) },
        method: ['stirred', 'shaken', 'built', 'blended', 'prep'].includes(raw.method) ? raw.method : '',
        glass: str(raw.glass),
        produces: catalog.has(produces) ? produces : null,
        ingredients,
        instructions: {
            he: (raw.stepsHe || []).map(str).filter(Boolean),
            en: (raw.stepsEn || []).map(str).filter(Boolean),
        },
        unmatchedCount: ingredients.filter(line => !line.ingredientId).length,
    }
}

/**
 * Reads recipes out of pasted text. Returns candidates; saves nothing.
 */
async function parseRecipes(text, catalog) {
    const source = String(text || '').trim()
    if (!source) {
        const err = new Error('There is no text to read')
        err.status = 400
        throw err
    }
    if (source.length > MAX_CHARS) {
        const err = new Error(`Paste at most ${MAX_CHARS} characters at a time`)
        err.status = 413
        throw err
    }

    const message = await getClient().messages.create({
        model: MODEL,
        max_tokens: 8000,
        system: `${SYSTEM_PROMPT}\n\nThe bar's ingredient catalogue:\n${catalogueFor(catalog)}`,
        tools: [TOOL],
        tool_choice: { type: 'tool', name: TOOL.name },
        messages: [{ role: 'user', content: `Read the recipes in this text:\n\n${source}` }],
    })

    const block = message?.content?.find(c => c.type === 'tool_use' && c.name === TOOL.name)
    if (!block) {
        const err = new Error('Could not read any recipe from this text')
        err.status = 502
        throw err
    }

    const recipes = (block.input?.recipes || [])
        .slice(0, MAX_RECIPES)
        .map(raw => toCandidate(raw, catalog))
        .filter(candidate => candidate.title.he || candidate.title.en)

    if (!recipes.length) {
        const err = new Error('No drink recipe was found in this text')
        err.status = 422
        err.code = 'no_recipes'
        throw err
    }

    return { recipes }
}
