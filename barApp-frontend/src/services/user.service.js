import { httpService } from './http.service'

export const userService = {
  login,
  signup,
  logout,
  getUsers,
  getLoggedInUser,
  getEmptyCredentials,
  setLoggedInUserUI,
  getLoggedInUserUI,
}

const BASE_URL = 'auth/'
const STORAGE_KEY_UI = 'loggedinUserUI'

async function login({ username, password }) {
  const user = await httpService.post(BASE_URL + 'login', {
    username,
    password,
  })
  _setLoggedInUserUI(user)
  return user
}

async function signup(credentials) {
  const user = await httpService.post(BASE_URL + 'signup', credentials)
  _setLoggedInUserUI(user)
  return user
}

async function logout() {
  await httpService.post(BASE_URL + 'logout')
  sessionStorage.removeItem(STORAGE_KEY_UI)
}

async function getUsers() {
  return await httpService.get('user')
}

/**
 * SECURITY NOTE: This retrieves minimal non-sensitive UI data from sessionStorage.
 * Full user data should be fetched from Redux store only.
 * Token is stored in httpOnly cookie, not accessible to JS.
 */
function getLoggedInUser() {
  // Return Redux store data - requires Redux to be available
  try {
    const entity = sessionStorage.getItem(STORAGE_KEY_UI)
    return entity ? JSON.parse(entity) : null
  } catch {
    return null
  }
}

/**
 * Get safe UI-only user data (non-sensitive fields only)
 */
function getLoggedInUserUI() {
  try {
    const entity = sessionStorage.getItem(STORAGE_KEY_UI)
    return entity ? JSON.parse(entity) : null
  } catch {
    return null
  }
}

/**
 * Set UI-only user data (safe to expose in sessionStorage)
 * Only store fields needed for UI display, never store sensitive data
 */
function setLoggedInUserUI(userData) {
  if (!userData) {
    sessionStorage.removeItem(STORAGE_KEY_UI)
    return
  }
  
  const uiData = {
    _id: userData._id,
    username: userData.username,
    fullname: userData.fullname || '',
    role: userData.role || 'bartender',
    companyDisplayName: userData.companyDisplayName || '',
    // NEVER store: password, dbName, companyName, email, phone, or any sensitive data
  }
  sessionStorage.setItem(STORAGE_KEY_UI, JSON.stringify(uiData))
}

function getEmptyCredentials() {
  return {
    username: '',
    password: '',
    fullname: '',
  }
}

function _setLoggedInUserUI(user) {
  setLoggedInUserUI(user)
}
