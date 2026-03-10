import { translate } from '@vitalets/google-translate-api'

// Security: Whitelist allowed languages to prevent injection
const ALLOWED_LANGUAGES = ['en', 'he', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'ru']

export async function translateText(req, res, next) {
  try {
    const { text, sourceLang } = req.body
    
    // Input validation
    if (!text?.trim()) return res.json({ he: text || '', en: text || '' })
    
    // Security: Validate source language is in whitelist
    if (!sourceLang || !ALLOWED_LANGUAGES.includes(sourceLang)) {
      return res.status(400).json({ 
        error: 'Invalid source language', 
        allowed: ALLOWED_LANGUAGES 
      })
    }
    
    // Security: Validate text length to prevent abuse
    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text too long (max 5000 characters)' })
    }

    const targetLang = sourceLang === 'he' ? 'en' : 'he'
    
    // Validate target language (should always be valid, but belt and suspenders)
    if (!ALLOWED_LANGUAGES.includes(targetLang)) {
      return res.status(400).json({ error: 'Invalid target language' })
    }
    
    const result = await translate(text, { from: sourceLang, to: targetLang })
    res.json({ [sourceLang]: text, [targetLang]: result.text })
  } catch (error) {
    next(error)
  }
}
