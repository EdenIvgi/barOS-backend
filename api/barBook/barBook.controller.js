import { barBookService } from './barBook.service.js'

export async function getBarBook(req, res) {
  try {
    const content = await barBookService.getContent()
    res.json(content)
  } catch (error) {
    console.error('[BarBookController] Error getting bar book:', error)
    res.status(500).json({ error: 'Failed to get bar book', details: error.message })
  }
}

export async function saveBarBook(req, res) {
  try {
    const content = req.body
    const saved = await barBookService.saveContent(content)
    res.json(saved)
  } catch (error) {
    console.error('[BarBookController] Error saving bar book:', error)
    res.status(500).json({ error: 'Failed to save bar book', details: error.message })
  }
}

export async function clearBarBook(req, res) {
  try {
    const content = await barBookService.clear()
    res.json({ ok: true, message: 'תוכן ספר הבר נוקה', content })
  } catch (error) {
    console.error('[BarBookController] Error clearing bar book:', error)
    res.status(500).json({ error: 'Failed to clear bar book', details: error.message })
  }
}
