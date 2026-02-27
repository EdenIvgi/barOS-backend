import { createSlice } from '@reduxjs/toolkit'
import { userService } from '../../services/user.service'

const initialState = {
  loggedInUser: userService.getLoggedInUser(),
  users: [],
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action) {
      state.loggedInUser = action.payload
    },
    setUsers(state, action) {
      state.users = action.payload
    },
  },
})

export const { setUser, setUsers } = userSlice.actions
export const userReducer = userSlice.reducer
