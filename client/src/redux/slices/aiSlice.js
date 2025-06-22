import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { toast } from "react-toastify"
import axiosInstance from "../../utils/axiosConfig"

// Ask AI query
export const askFarmingQuery = createAsyncThunk(
    "ai/askFarmingQuery",
    async (queryData, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post("/api/ai/ask", queryData)
            return data
        } catch (error) {
            const message = error.response && error.response.data.message
                ? error.response.data.message
                : error.message
            return rejectWithValue(message)
        }
    }
)

// Get supported languages
export const getSupportedLanguages = createAsyncThunk(
    "ai/getSupportedLanguages",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get("/api/ai/languages")
            return data
        } catch (error) {
            const message = error.response && error.response.data.message
                ? error.response.data.message
                : error.message
            return rejectWithValue(message)
        }
    }
)

// Get query history
export const getQueryHistory = createAsyncThunk(
    "ai/getQueryHistory",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get("/api/ai/history")
            return data
        } catch (error) {
            const message = error.response && error.response.data.message
                ? error.response.data.message
                : error.message
            return rejectWithValue(message)
        }
    }
)

const initialState = {
    conversations: [],
    currentConversation: null,
    supportedLanguages: [],
    loading: false,
    queryLoading: false,
    error: null,
    selectedLanguage: 'en'
}

const aiSlice = createSlice({
    name: "ai",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null
        },
        setSelectedLanguage: (state, action) => {
            state.selectedLanguage = action.payload
        },
        addConversation: (state, action) => {
            state.conversations.unshift(action.payload)
        },
        clearConversations: (state) => {
            state.conversations = []
        }
    },
    extraReducers: (builder) => {
        builder
            // Ask farming query
            .addCase(askFarmingQuery.pending, (state) => {
                state.queryLoading = true
                state.error = null
            })
            .addCase(askFarmingQuery.fulfilled, (state, action) => {
                state.queryLoading = false
                state.currentConversation = action.payload.data
                // Add to conversations history
                state.conversations.unshift({
                    id: Date.now(),
                    query: action.payload.data.query,
                    answer: action.payload.data.answer,
                    language: action.payload.data.language,
                    timestamp: new Date().toISOString()
                })
            })
            .addCase(askFarmingQuery.rejected, (state, action) => {
                state.queryLoading = false
                state.error = action.payload
                toast.error("Failed to get AI response")
            })
            // Get supported languages
            .addCase(getSupportedLanguages.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(getSupportedLanguages.fulfilled, (state, action) => {
                state.loading = false
                state.supportedLanguages = action.payload.data
            })
            .addCase(getSupportedLanguages.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Get query history
            .addCase(getQueryHistory.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(getQueryHistory.fulfilled, (state, action) => {
                state.loading = false
                // Handle history data if implemented on backend
            })
            .addCase(getQueryHistory.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
    },
})

export const { clearError, setSelectedLanguage, addConversation, clearConversations } = aiSlice.actions

export default aiSlice.reducer
