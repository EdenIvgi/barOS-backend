import express from 'express'
import { getBarBook, saveBarBook, clearBarBook } from './barBook.controller.js'

const router = express.Router()

router.get('/', getBarBook)
router.post('/clear', clearBarBook)
router.put('/', saveBarBook)

export const barBookRoutes = router
