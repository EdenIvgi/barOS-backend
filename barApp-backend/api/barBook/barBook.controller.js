import { barBookService } from './barBook.service.js'

export async function getBarBook(req, res, next) {
    try {
        const content = await barBookService.getContent(req.userDbName)
        res.json(content)
    } catch (error) {
        next(error)
    }
}

export async function saveBarBook(req, res, next) {
    try {
        const saved = await barBookService.saveContent(req.body, req.userDbName)
        res.json(saved)
    } catch (error) {
        next(error)
    }
}

export async function clearBarBook(req, res, next) {
    try {
        const content = await barBookService.clear(req.userDbName)
        res.json({ ok: true, message: 'Bar book content cleared', content })
    } catch (error) {
        next(error)
    }
}
