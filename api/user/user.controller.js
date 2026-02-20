import { userService } from './user.service.js'

export async function getUsers(req, res, next) {
    try {
        const users = await userService.query(req.query)
        res.json(users)
    } catch (error) {
        next(error)
    }
}
