import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { toast } from "react-toastify"
import axiosInstance from "../../utils/axiosConfig"

// Get all users (admin only)
export const getAllUsers = createAsyncThunk("users/getAllUsers", async (_, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.get(`/api/users`)
    return data
  } catch (error) {
    const message = error.response && error.response.data.message ? error.response.data.message : error.message
    return rejectWithValue(message)
  }
})

// Delete user (admin only)
export const deleteUser = createAsyncThunk("users/deleteUser", async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/api/users/${id}`)
    return id
  } catch (error) {
    const message = error.response && error.response.data.message ? error.response.data.message : error.message
    return rejectWithValue(message)
  }
})

const initialState = {
  users: [],
  loading: false,
  error: null,
}

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all users
      .addCase(getAllUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.loading = false
        state.users = action.payload.data
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false
        state.users = state.users.filter((user) => user._id !== action.payload)
        toast.success("User deleted successfully!")
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })
  },
})

export const { clearUserError } = userSlice.actions

export default userSlice.reducer
