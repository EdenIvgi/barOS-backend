import { userService } from '../../services/user.service.js'
import { setUser, setUsers } from '../slices/user.slice'
import { store } from '../store.js'

export async function login(credentials) {
  try {
    const user = await userService.login(credentials)
    store.dispatch(setUser(user))
  } catch (error) {
    console.error('user actions -> Cannot login', error)
    throw error
  }
}

export async function signup(credentials) {
  try {
    const user = await userService.signup(credentials)
    store.dispatch(setUser(user))
  } catch (error) {
    console.error('user actions -> Cannot signup', error)
    throw error
  }
}

export async function logout() {
  try {
    await userService.logout()
    store.dispatch(setUser(null))
  } catch (error) {
    console.error('user actions -> Cannot logout', error)
    throw error
  }
}

export async function loadUsers() {
  try {
    const users = await userService.getUsers()
    store.dispatch(setUsers(users))
  } catch (err) {
    console.error('UserActions: err in loadUsers', err)
  }
}
