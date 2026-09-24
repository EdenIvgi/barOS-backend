import express from 'express'
import { translateText } from './translate.controller.js'
import { requireAuth } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'

const router = express.Router()

const translateSchema = {
    text: { isString: true, maxLength: 5000 },
    sourceLang: { required: true, isString: true, oneOf: ['he', 'en'] },
}

router.post('/', requireAuth, validate(translateSchema), translateText)

export const translateRoutes = router
