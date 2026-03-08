import { userService } from './user.service.js'

export async function getUsers(req, res, next) {
    try {
        const users = await userService.query(req.query, req.userDbName)
        res.json(users)
    } catch (error) {
        next(error)
    }
}
