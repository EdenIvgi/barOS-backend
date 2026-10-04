import express from 'express'
import { getSetup, saveSetup } from './setup.controller.js'
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'

// Only `status` is worth constraining here: `steps` is validated in the model,
// which is where the list of steps lives.
const setupSchema = {
    status: { isString: true, oneOf: ['pending', 'done'] },
}

const router = express.Router()

// Setting the bar up is the admin's job, and reading the state only ever drives
// an admin-only screen, so both sides require the role.
router.get('/', requireAuth, requireAdmin, getSetup)
router.put('/', requireAuth, requireAdmin, validate(setupSchema), saveSetup)

export const setupRoutes = router
