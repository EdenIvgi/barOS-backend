import { dbService } from './mongo.service.js'
import { logger } from './logger.service.js'

const DEFAULT_CATEGORIES = [
    { name: 'ספירטס', nameEn: 'Spirits', icon: '🥃', order: 1 },
    { name: 'יין', nameEn: 'Wine', icon: '🍷', order: 2 },
    { name: 'בירה', nameEn: 'Beer', icon: '🍺', order: 3 },
    { name: 'מיצים', nameEn: 'Juices', icon: '🧃', order: 4 },
    { name: 'סירופים', nameEn: 'Syrups', icon: '🍯', order: 5 },
    { name: 'גרניש', nameEn: 'Garnish', icon: '🍋', order: 6 },
    { name: 'ציוד', nameEn: 'Equipment', icon: '🔧', order: 7 },
    { name: 'שונות', nameEn: 'Misc', icon: '📦', order: 8 },
]

const DEFAULT_RECIPES = [
    {
        title: 'Cinnamon & Clove Syrup',
        ingredients: ['10 cinnamon sticks', '20 cloves', '3 orange peels', '1kg sugar', '1L water'],
        instructions: [
            'Crush 2 cinnamon sticks into small pieces.',
            'Heat 1L water and sugar in a pot until sugar dissolves.',
            'Add remaining ingredients and simmer on medium heat for 5 minutes.',
            'Reduce to low heat and simmer for 20 more minutes.',
            'Cool in fridge for 30 minutes, then strain through a fine sieve.',
        ],
    },
    {
        title: 'Coriander & Passionfruit Syrup',
        ingredients: ['Sugar water', '4L container of coriander', 'Passionfruit puree'],
        instructions: [
            'Fill blender with coriander heads and 1L sugar water.',
            'Blend and strain through cheesecloth.',
            'Add 0.5L sugar water and a full bottle of passionfruit puree.',
        ],
    },
    {
        title: 'Honey & Ginger Syrup',
        ingredients: ['Ginger', 'Honey', 'Water'],
        instructions: [
            'Blend 1kg of ginger.',
            'Heat 2kg honey and 2L water in a pot until boiling.',
            'Add ginger and bring back to a boil.',
            'Reduce to low heat for about 20 minutes.',
            'Let cool and strain through cheesecloth.',
        ],
    },
]

export async function provisionUserDb(barId) {
    const dbName = `bar_${barId}`
    logger.info(`Provisioning new bar DB: ${dbName}`)

    try {
        await _seedCategories(dbName)
        await _seedRecipes(dbName)
        logger.info(`Successfully provisioned DB: ${dbName}`)
    } catch (err) {
        logger.error(`Failed to provision DB: ${dbName}`, err)
        throw err
    }
}

async function _seedCategories(dbName) {
    const collection = await dbService.getCollection('category', dbName)
    const now = Date.now()
    for (const cat of DEFAULT_CATEGORIES) {
        const exists = await collection.findOne({ nameEn: cat.nameEn })
        if (exists) continue
        await collection.insertOne({
            name: cat.name,
            nameEn: cat.nameEn,
            icon: cat.icon,
            order: cat.order,
            isActive: true,
            createdAt: now,
            updatedAt: now
        })
    }
}

async function _seedRecipes(dbName) {
    const collection = await dbService.getCollection('recipe', dbName)
    const now = Date.now()
    for (const r of DEFAULT_RECIPES) {
        const exists = await collection.findOne({ title: r.title })
        if (exists) continue
        await collection.insertOne({
            title: r.title,
            ingredients: r.ingredients || [],
            instructions: r.instructions || [],
            createdAt: now,
            updatedAt: now
        })
    }
}
