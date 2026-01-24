import { authService } from './auth.service.js'

export async function login(req, res) {
    try {
        const { username, password } = req.body
        const user = await authService.login(username, password)
        console.log(`[Controller] User logged in: ${user.username}`)
        res.json(user)
    } catch (error) {
        console.error('[Controller] Error logging in:', error)
        res.status(401).json({ error: error.message || 'Invalid credentials' })
    }
}

export async function signup(req, res) {
    try {
        const userData = req.body
        const user = await authService.signup(userData)
        console.log(`[Controller] User signed up: ${user.username}`)
        res.status(201).json(user)
    } catch (error) {
        console.error('[Controller] Error signing up:', error)
        res.status(400).json({ error: error.message || 'Failed to signup' })
    }
}

export async function logout(req, res) {
    try {
        await authService.logout()
        res.json({ message: 'Logged out successfully' })
    } catch (error) {
        console.error('[Controller] Error logging out:', error)
        res.status(500).json({ error: 'Failed to logout' })
    }
}
