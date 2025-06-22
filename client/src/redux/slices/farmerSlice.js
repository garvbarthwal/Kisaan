import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { toast } from "react-toastify"
import axiosInstance from "../../utils/axiosConfig"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Get all farmers
export const getAllFarmers = createAsyncThunk("farmers/getAllFarmers", async (_, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.get(`/api/users/farmers`)
    return data
  } catch (error) {
    const message = error.response && error.response.data.message ? error.response.data.message : error.message
    return rejectWithValue(message)
  }
})

// Get farmer profile
export const getFarmerProfile = createAsyncThunk("farmers/getFarmerProfile", async (id, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.get(`/api/users/farmers/${id}`)
    return data
  } catch (error) {
    const message = error.response && error.response.data.message ? error.response.data.message : error.message
    return rejectWithValue(message)
  }
})

// Update farmer profile
export const updateFarmerProfile = createAsyncThunk(
  "farmers/updateFarmerProfile",
  async (profileData, { rejectWithValue, getState }) => {
    try {
      // Token is automatically added by the axiosInstance interceptor
      const { data } = await axiosInstance.put(`/api/users/farmers/profile`, profileData)
      return data
    } catch (error) {
      const message = error.response && error.response.data.message ? error.response.data.message : error.message
      return rejectWithValue(message)
    }
  },
)

const initialState = {
  farmers: [],
  farmerProfile: null,
  myFarmerProfile: null,
  loading: false,
  error: null,
  success: false,
}

const farmerSlice = createSlice({
  name: "farmers",
  initialState,
  reducers: {
    clearFarmerError: (state) => {
      state.error = null
    },
    resetFarmerSuccess: (state) => {
      state.success = false
    },
    clearFarmerProfile: (state) => {
      state.farmerProfile = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all farmers
      .addCase(getAllFarmers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getAllFarmers.fulfilled, (state, action) => {
        state.loading = false
        state.farmers = action.payload.data
      })
      .addCase(getAllFarmers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Get farmer profile
      .addCase(getFarmerProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getFarmerProfile.fulfilled, (state, action) => {
        state.loading = false
        state.farmerProfile = action.payload.data
      })
      .addCase(getFarmerProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update farmer profile
      .addCase(updateFarmerProfile.pending, (state) => {
        state.loading = true
        state.error = null
        state.success = false
      })
      .addCase(updateFarmerProfile.fulfilled, (state, action) => {
        state.loading = false
        state.success = true
        state.myFarmerProfile = action.payload.data
        toast.success("Farmer profile updated successfully!")
      })
      .addCase(updateFarmerProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })
  },
})

export const { clearFarmerError, resetFarmerSuccess, clearFarmerProfile } = farmerSlice.actions

export default farmerSlice.reducer
