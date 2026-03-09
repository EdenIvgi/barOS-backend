import { translate } from '@vitalets/google-translate-api'

export async function translateText(req, res, next) {
  try {
    const { text, sourceLang } = req.body
    if (!text?.trim()) return res.json({ he: text || '', en: text || '' })

    const targetLang = sourceLang === 'he' ? 'en' : 'he'
    const result = await translate(text, { from: sourceLang, to: targetLang })
    res.json({ [sourceLang]: text, [targetLang]: result.text })
  } catch (error) {
    next(error)
  }
}
