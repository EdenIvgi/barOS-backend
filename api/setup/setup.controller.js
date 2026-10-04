import { setupService } from './setup.service.js'

export async function getSetup(req, res, next) {
    try {
        res.json(await setupService.getState(req.userDbName))
    } catch (error) {
        next(error)
    }
}

export async function saveSetup(req, res, next) {
    try {
        res.json(await setupService.saveState(req.body, req.userDbName))
    } catch (error) {
        next(error)
    }
}
