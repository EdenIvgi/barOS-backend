import { httpService } from './http.service'

export const userService = {
  login,
  signup,
  logout,
  getUsers,
  getLoggedInUser,
  getEmptyCredentials,
}

const BASE_URL = 'auth/'
const STORAGE_KEY = 'loggedinUser'

async function login({ username, password }) {
  try {
    const user = await httpService.post(BASE_URL + 'login', {
      username,
      password,
    })
    _setLoggedInUser(user)
    return user
  } catch (error) {
    console.log('Could not login')
  }
}

async function signup(credentials) {
  try {
    const user = await httpService.post(BASE_URL + 'signup', credentials)
    _setLoggedInUser(user)
    return user
  } catch (err) {
    console.log('Could not signup')
  }
}

async function logout() {
  try {
    await httpService.post(BASE_URL + 'logout')
    sessionStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.log('Could not logout')
  }
}

async function getUsers() {
  try {
    return await httpService.get(`user`)
  } catch (error) {
    console.log('Could get users')
  }
}

function getLoggedInUser() {
  const entity = sessionStorage.getItem(STORAGE_KEY)
  return JSON.parse(entity)
}

function getEmptyCredentials() {
  return {
    username: '',
    password: '',
    fullname: '',
  }
}

function _setLoggedInUser(user) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}
