/**
 * Seed demo data into a single tenant database.
 * Usage: node scripts/seed-demo.mjs <dbName>
 * Safety: refuses to run without an explicit dbName argument.
 */
import 'dotenv/config'
import { MongoClient } from 'mongodb'

const dbName = process.argv[2]
if (!dbName) {
    console.error('Refusing to run: pass a target dbName, e.g. node scripts/seed-demo.mjs testi_db')
    process.exit(1)
}

const DAY = 24 * 60 * 60 * 1000
const now = Date.now()

const categories = [
    { name: 'ויסקי', nameEn: 'Whiskey', icon: 'whiskey', order: 1 },
    { name: 'וודקה', nameEn: 'Vodka', icon: 'vodka', order: 2 },
    { name: 'גין', nameEn: 'Gin', icon: 'gin', order: 3 },
    { name: 'יין', nameEn: 'Wine', icon: 'wine', order: 4 },
    { name: 'בירה', nameEn: 'Beer', icon: 'beer', order: 5 },
    { name: 'מוגזים', nameEn: 'Soft Drinks', icon: 'soda', order: 6 },
    { name: 'ליקרים', nameEn: 'Liqueur', icon: 'liqueur', order: 7 },
]

const SUP = {
    diplomat: 'דיפלומט',
    bandit: 'בנדיט יבוא',
    tempo: 'טמפו',
    carmel: 'יקבי כרמל',
    coca: 'קוקה קולה',
}

// [name, nameEn, categoryEn, supplier, volumeMl, stock, minStock, optimalStock]
const itemDefs = [
    ['גוני ווקר בלאק', 'Johnnie Walker Black', 'Whiskey', SUP.diplomat, 700, 12, 4, 15],
    ['גיימסון', 'Jameson', 'Whiskey', SUP.diplomat, 700, 3, 4, 12],
    ['ג׳ק דניאלס', 'Jack Daniels', 'Whiskey', SUP.bandit, 700, 8, 4, 12],
    ['שיבאס ריגל 12', 'Chivas Regal 12', 'Whiskey', SUP.diplomat, 700, 2, 3, 10],
    ['מקאלן 12', 'Macallan 12', 'Whiskey', SUP.bandit, 700, 1, 2, 6],
    ['אבסולוט', 'Absolut', 'Vodka', SUP.diplomat, 700, 20, 6, 24],
    ['גריי גוס', 'Grey Goose', 'Vodka', SUP.bandit, 700, 5, 3, 10],
    ['בלוודר', 'Belvedere', 'Vodka', SUP.bandit, 700, 0, 2, 8],
    ['סמירנוף', 'Smirnoff', 'Vodka', SUP.tempo, 700, 18, 6, 20],
    ['בומביי ספייר', 'Bombay Sapphire', 'Gin', SUP.diplomat, 700, 9, 4, 12],
    ['הנדריקס', 'Hendricks', 'Gin', SUP.bandit, 700, 3, 3, 8],
    ['טנקרי', 'Tanqueray', 'Gin', SUP.diplomat, 700, 11, 4, 12],
    ['כרמל אדום יבש', 'Carmel Dry Red', 'Wine', SUP.carmel, 750, 24, 10, 36],
    ['רקנאטי שרדונה', 'Recanati Chardonnay', 'Wine', SUP.carmel, 750, 14, 8, 24],
    ['יתיר קברנה', 'Yatir Cabernet', 'Wine', SUP.carmel, 750, 6, 6, 18],
    ['גולדסטאר חבית', 'Goldstar Draft', 'Beer', SUP.tempo, 30000, 48, 24, 72],
    ['טובורג', 'Tuborg', 'Beer', SUP.tempo, 330, 36, 24, 72],
    ['הייניקן', 'Heineken', 'Beer', SUP.tempo, 330, 12, 24, 60],
    ['קורונה', 'Corona', 'Beer', SUP.bandit, 330, 30, 18, 48],
    ['קוקה קולה', 'Coca Cola', 'Soft Drinks', SUP.coca, 1500, 90, 40, 120],
    ['ספרייט', 'Sprite', 'Soft Drinks', SUP.coca, 1500, 22, 40, 120],
    ['סודה', 'Soda', 'Soft Drinks', SUP.coca, 1500, 60, 30, 90],
    ['מיץ תפוזים', 'Orange Juice', 'Soft Drinks', SUP.coca, 1000, 15, 12, 36],
    ['קמפרי', 'Campari', 'Liqueur', SUP.diplomat, 700, 7, 3, 10],
    ['בייליס', 'Baileys', 'Liqueur', SUP.diplomat, 700, 4, 3, 10],
    ['אפרול', 'Aperol', 'Liqueur', SUP.bandit, 700, 2, 3, 10],
    ['קואנטרו', 'Cointreau', 'Liqueur', SUP.bandit, 700, 6, 3, 8],
]

const client = await MongoClient.connect(process.env.DB_URL)
const db = client.db(dbName)

console.log(`Seeding demo data into "${dbName}"...`)

await db.collection('category').deleteMany({})
await db.collection('items').deleteMany({})
await db.collection('order').deleteMany({})

const catDocs = categories.map(c => ({ ...c, isActive: true, createdAt: now, updatedAt: now }))
await db.collection('category').insertMany(catDocs)
console.log(`  categories: ${catDocs.length}`)

const itemDocs = itemDefs.map(([name, nameEn, catEn, supplier, volumeMl, stock, minS, optS]) => ({
    name,
    nameEn,
    description: '',
    supplier,
    volumeMl,
    category: categories.find(c => c.nameEn === catEn).name,
    imageUrl: '',
    isAvailable: stock > 0,
    stockQuantity: stock,
    minStockLevel: minS,
    optimalStockLevel: optS,
    tags: [],
    quantity: null,
    createdAt: now - 30 * DAY,
    updatedAt: now,
}))
const itemRes = await db.collection('items').insertMany(itemDocs)
const withIds = itemDocs.map((d, i) => ({ ...d, _id: itemRes.insertedIds[i] }))
const lowStock = itemDocs.filter(i => i.stockQuantity < i.minStockLevel).length
console.log(`  items: ${itemDocs.length} (${lowStock} below min stock)`)

function orderFor(supplier, daysAgo, hour, names, status) {
    const items = names.map(n => {
        const it = withIds.find(x => x.nameEn === n)
        const quantity = Math.max(1, it.optimalStockLevel - it.stockQuantity)
        return {
            itemId: it._id.toString(),
            name: it.name,
            nameEn: it.nameEn,
            supplier: it.supplier,
            volumeMl: it.volumeMl,
            quantity,
        }
    })
    const d = new Date(now - daysAgo * DAY)
    d.setHours(hour, 30, 0, 0)
    return {
        items,
        userId: null,
        status,
        type: 'stock_order',
        supplier,
        totalUnits: items.reduce((s, i) => s + i.quantity, 0),
        createdAt: d.getTime(),
        updatedAt: d.getTime(),
    }
}

const orders = [
    orderFor(SUP.diplomat, 13, 11, ['Johnnie Walker Black', 'Jameson', 'Absolut'], 'received'),
    orderFor(SUP.tempo, 12, 9, ['Goldstar Draft', 'Tuborg', 'Heineken'], 'received'),
    orderFor(SUP.carmel, 11, 15, ['Carmel Dry Red', 'Recanati Chardonnay'], 'received'),
    orderFor(SUP.coca, 10, 8, ['Coca Cola', 'Sprite', 'Soda'], 'received'),
    orderFor(SUP.bandit, 9, 13, ['Grey Goose', 'Hendricks', 'Corona'], 'received'),
    orderFor(SUP.diplomat, 7, 10, ['Chivas Regal 12', 'Bombay Sapphire', 'Campari'], 'received'),
    orderFor(SUP.tempo, 6, 14, ['Goldstar Draft', 'Heineken'], 'received'),
    orderFor(SUP.carmel, 5, 16, ['Yatir Cabernet', 'Carmel Dry Red'], 'pending'),
    orderFor(SUP.coca, 4, 9, ['Coca Cola', 'Orange Juice'], 'received'),
    orderFor(SUP.bandit, 3, 12, ['Belvedere', 'Macallan 12', 'Aperol'], 'pending'),
    orderFor(SUP.diplomat, 2, 11, ['Jameson', 'Baileys'], 'pending'),
    orderFor(SUP.tempo, 1, 10, ['Tuborg', 'Goldstar Draft', 'Heineken'], 'pending'),
    // Deliberate late-night order: surfaces the UTC toDateKey() off-by-one-day bug
    orderFor(SUP.bandit, 1, 1, ['Cointreau', 'Tanqueray'], 'pending'),
]
await db.collection('order').insertMany(orders)
console.log(`  orders: ${orders.length} (one at 01:30 to surface the UTC date-grouping bug)`)

const barBookPages = [
    {
        _id: 'page_opening',
        type: 'checklist',
        title: { he: 'פתיחת משמרת', en: 'Opening Shift' },
        items: [
            { text: { he: 'לבדוק מלאי קרח', en: 'Check ice stock' }, checked: false },
            { text: { he: 'לחתוך פירות לגרניש', en: 'Cut garnish fruit' }, checked: true },
            { text: { he: 'לנקות את הבר', en: 'Clean the bar' }, checked: true },
            { text: { he: 'לבדוק חביות בירה', en: 'Check beer kegs' }, checked: false },
        ],
    },
    {
        _id: 'page_closing',
        type: 'checklist',
        title: { he: 'סגירת משמרת', en: 'Closing Shift' },
        items: [
            { text: { he: 'לספור קופה', en: 'Count register' }, checked: false },
            { text: { he: 'לשטוף כוסות', en: 'Wash glassware' }, checked: false },
            { text: { he: 'לכבות מקררי תצוגה', en: 'Turn off display fridges' }, checked: false },
        ],
    },
    {
        _id: 'page_daily',
        type: 'daily',
        title: { he: 'משימות יומיות', en: 'Daily Tasks' },
        tasks: [
            { day: { he: 'ראשון', en: 'Sunday' }, text: { he: 'הזמנת אלכוהול שבועית', en: 'Weekly alcohol order' } },
            { day: { he: 'שלישי', en: 'Tuesday' }, text: { he: 'ספירת מלאי בירה', en: 'Beer stock count' } },
            { day: { he: 'חמישי', en: 'Thursday' }, text: { he: 'ניקוי יסודי של הבר', en: 'Deep clean the bar' } },
        ],
    },
    {
        _id: 'page_recipes',
        type: 'recipes',
        title: { he: 'מתכונים', en: 'Recipes' },
        items: [
            {
                _id: 'r1',
                title: { he: 'נגרוני', en: 'Negroni' },
                ingredients: [
                    { he: '30 מ"ל גין', en: '30ml Gin' },
                    { he: '30 מ"ל קמפרי', en: '30ml Campari' },
                    { he: '30 מ"ל ורמוט אדום', en: '30ml Sweet Vermouth' },
                ],
                instructions: [
                    { he: 'לערבב עם קרח', en: 'Stir with ice' },
                    { he: 'להגיש עם קליפת תפוז', en: 'Garnish with orange peel' },
                ],
            },
            {
                _id: 'r2',
                title: { he: 'אפרול שפריץ', en: 'Aperol Spritz' },
                ingredients: [
                    { he: '60 מ"ל אפרול', en: '60ml Aperol' },
                    { he: '90 מ"ל פרוסקו', en: '90ml Prosecco' },
                    { he: 'סודה', en: 'Splash of soda' },
                ],
                instructions: [
                    { he: 'למזוג על קרח', en: 'Build over ice' },
                    { he: 'להגיש עם פרוסת תפוז', en: 'Garnish with orange slice' },
                ],
            },
            {
                _id: 'r3',
                title: { he: 'ויסקי סאוור', en: 'Whiskey Sour' },
                ingredients: [
                    { he: '50 מ"ל ויסקי', en: '50ml Whiskey' },
                    { he: '25 מ"ל מיץ לימון', en: '25ml Lemon juice' },
                    { he: '20 מ"ל סירופ סוכר', en: '20ml Simple syrup' },
                ],
                instructions: [
                    { he: 'לשייק חזק', en: 'Shake hard' },
                    { he: 'לסנן לכוס', en: 'Strain into glass' },
                ],
            },
        ],
    },
    {
        _id: 'page_stock',
        type: 'stock',
        title: { he: 'טבלת מלאי', en: 'Stock Table' },
        headers: [
            { he: 'פריט', en: 'Item' },
            { he: 'ספק', en: 'Supplier' },
            { he: 'מלאי', en: 'Stock' },
        ],
        rows: [
            [{ he: 'גין', en: 'Gin' }, { he: 'דיפלומט', en: 'Diplomat' }, { he: '9', en: '9' }],
            [{ he: 'וודקה', en: 'Vodka' }, { he: 'בנדיט', en: 'Bandit' }, { he: '5', en: '5' }],
        ],
    },
]
await db.collection('barBook').deleteMany({})
await db.collection('barBook').insertOne({ pages: barBookPages, createdAt: now, updatedAt: now })
console.log(`  barBook pages: ${barBookPages.length}`)

await client.close()
console.log('Done.')
