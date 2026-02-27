/**
 * משחזר את שלושת המתכונים ההתחלתיים ומוסיף אותם לקולקשן recipe בדאטה בייס.
 * מוסיף רק מתכונים שעדיין לא קיימים (לפי כותרת).
 * הרצה: npm run seed:recipes  או  node data/seed-recipes.mjs
 */
import { MongoClient } from 'mongodb'
import { config } from '../config/index.js'

const DEFAULT_RECIPES = [
  {
    title: 'סירופ קינמון וציפורן',
    ingredients: ['10 מקלות קינמון', '20 מקלות ציפורן', '3 קליפות תפוז', 'קילו סוכר', 'ליטר מים'],
    instructions: [
      'נכתוש 2 מקלות קינמון לשברים דקים.',
      'נחמם בסיר ליטר מים וסוכר.',
      'כאשר הסוכר נמס לגמרי נוסיף את שאר המרכיבים. נבשל בטמפרטורה בינונית כ־5 דקות.',
      'לאחר מכן נוריד את הטמפרטורה לחום נמוך (בעבוע קל) למשך 20 דקות נוספות.',
      'נשאיר במקרר למשך כחצי שעה ונסנן במסננת דקה.',
    ],
  },
  {
    title: 'סירופ כוסברה ופסיפלורה',
    ingredients: ['מי סוכר', 'קופסת 4 ליטר של כוסברה', 'מחית פסיפלורה'],
    instructions: [
      'בבלנדר נמלא ראשים של כוסברה וליטר מי סוכר. נשים כוסברה עד שהבלנדר מלא.',
      'נערבל הכל ונסנן עם בד חיתול.',
      'אל התערובת שיצאה נוסיף חצי ליטר מי סוכר ובקבוק שלם של מחית פסיפלורה.',
    ],
  },
  {
    title: 'סירופ דבש וגינגר',
    ingredients: ['ג׳ינג׳ר', 'דבש', 'מים'],
    instructions: [
      'נטחן קילו גינגר בבלנדר.',
      'על סיר אינדוקציה נעלה 2 קילו דבש ו־2 ליטר מים.',
      'נוסיף את הגינגר לסיר ונחמם עד לבעבוע.',
      'נוריד את החום לעוצמה 4 למשך כ־20 דקות.',
      'לאחר מכן ניתן לו להצטנן ונסנן דרך בד חיתול.',
    ],
  },
]

async function seedRecipes() {
  let client
  try {
    client = new MongoClient(config.dbURL)
    await client.connect()
    console.log('Connected to MongoDB')
    const db = client.db(config.dbName)
    const collection = db.collection('recipe')
    const now = Date.now()
    let added = 0
    for (const r of DEFAULT_RECIPES) {
      const exists = await collection.findOne({ title: r.title })
      if (exists) {
        console.log(`Already exists: "${r.title}" – skipped`)
        continue
      }
      await collection.insertOne({
        title: r.title,
        ingredients: r.ingredients || [],
        instructions: r.instructions || [],
        createdAt: now,
        updatedAt: now,
      })
      added++
      console.log(`Added: "${r.title}"`)
    }
    console.log(`Done. Added ${added} recipe(s) to the database.`)
  } catch (err) {
    console.error('Seed failed:', err.message)
    process.exit(1)
  } finally {
    if (client) await client.close()
  }
}

seedRecipes()
