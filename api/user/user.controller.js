import { userService } from './user.service.js'

export async function getUsers(req, res) {
    try {
        const users = await userService.query(req.query)
        console.log(`[Controller] Retrieved ${users.length} users`)
        res.json(users)
    } catch (error) {
        console.error('[Controller] Error getting users:', error)
        res.status(500).json({ error: 'Failed to get users' })
    }
}
