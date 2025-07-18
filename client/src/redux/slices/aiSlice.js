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

// Speech to Text
export const speechToText = createAsyncThunk(
    "ai/speechToText",
    async (speechData, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post("/api/ai/stt", speechData)
            return data
        } catch (error) {
            const message = error.response && error.response.data.message
                ? error.response.data.message
                : error.message
            return rejectWithValue(message)
        }
    }
)

// Text to Speech
export const textToSpeech = createAsyncThunk(
    "ai/textToSpeech",
    async (ttsData, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post("/api/ai/tts", ttsData)
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

// Get sample queries
export const getSampleQueries = createAsyncThunk(
    "ai/getSampleQueries",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get("/api/ai/sample-queries")
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
    sampleQueries: [],
    loading: false,
    queryLoading: false,
    sttLoading: false,
    ttsLoading: false,
    error: null,
    voiceSettings: {
        autoSpeak: true,
        autoSendOnVoiceEnd: true,
        speechRate: 0.9,
        speechPitch: 1,
        speechVolume: 0.8,
        enableVoiceAutoSend: true,
        voiceEndDelay: 1500, // ms to wait after voice ends before auto-sending
        enableVoiceFeedback: true // visual/audio feedback during recording
    },
    isListening: false,
    isSpeaking: false,
    voiceTranscript: '',
    lastVoiceInput: null
}

const aiSlice = createSlice({
    name: "ai",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null
        },
        addConversation: (state, action) => {
            state.conversations.unshift(action.payload)
        },
        updateConversationWithProcessedText: (state, action) => {
            const { conversationId, processedText } = action.payload;
            const conversation = state.conversations.find(c => c.id === conversationId);
            if (conversation) {
                conversation.processedAnswer = processedText;
                conversation.speechReady = true;
            }
        },
        markConversationSpeechReady: (state, action) => {
            const { conversationId, processedText } = action.payload;
            const conversation = state.conversations.find(c => c.id === conversationId);
            if (conversation) {
                conversation.processedAnswer = processedText || conversation.speechAnswer || conversation.answer;
                conversation.speechReady = true;
                conversation.displayReady = true; // Mark display as ready when speech is ready
            }
        },
        markConversationDisplayReady: (state, action) => {
            const { conversationId } = action.payload;
            const conversation = state.conversations.find(c => c.id === conversationId);
            if (conversation) {
                conversation.displayReady = true;
            }
        },
        clearConversations: (state) => {
            state.conversations = []
        },
        setVoiceSettings: (state, action) => {
            state.voiceSettings = { ...state.voiceSettings, ...action.payload }
        },
        setListeningState: (state, action) => {
            state.isListening = action.payload
        },
        setSpeakingState: (state, action) => {
            state.isSpeaking = action.payload
        },
        setVoiceTranscript: (state, action) => {
            state.voiceTranscript = action.payload
        },
        setLastVoiceInput: (state, action) => {
            state.lastVoiceInput = action.payload
        },
        updateConversationWithSpeech: (state, action) => {
            const { conversationId, speechData } = action.payload
            const conversation = state.conversations.find(c => c.id === conversationId)
            if (conversation) {
                conversation.speechData = speechData
            }
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
                // Add to conversations history with dual response structure
                const responseData = action.payload.data;
                state.conversations.unshift({
                    id: Date.now(),
                    query: responseData.query,
                    answer: responseData.answer, // Speech-optimized response
                    speechAnswer: responseData.speechAnswer || responseData.answer,
                    displayAnswer: responseData.displayAnswer || responseData.answer,
                    processedAnswer: null, // Will be set when speech processing is complete
                    speechReady: false,
                    displayReady: false, // Display will be ready when speech is ready
                    hasDisplayData: responseData.hasDisplayData || false,
                    type: responseData.type || 'general_query',
                    language: responseData.language,
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
            // Speech to Text
            .addCase(speechToText.pending, (state) => {
                state.sttLoading = true
                state.error = null
            })
            .addCase(speechToText.fulfilled, (state, action) => {
                state.sttLoading = false
                // Handle STT success if needed
            })
            .addCase(speechToText.rejected, (state, action) => {
                state.sttLoading = false
                state.error = action.payload
            })
            // Text to Speech
            .addCase(textToSpeech.pending, (state) => {
                state.ttsLoading = true
                state.error = null
            })
            .addCase(textToSpeech.fulfilled, (state, action) => {
                state.ttsLoading = false
                // Handle TTS success if needed
            })
            .addCase(textToSpeech.rejected, (state, action) => {
                state.ttsLoading = false
                state.error = action.payload
            })
            // Get query history
            .addCase(getQueryHistory.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(getQueryHistory.fulfilled, (state) => {
                state.loading = false
                // Handle history data if implemented on backend
            })
            .addCase(getQueryHistory.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Get sample queries
            .addCase(getSampleQueries.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(getSampleQueries.fulfilled, (state, action) => {
                state.loading = false
                state.sampleQueries = action.payload.data
            })
            .addCase(getSampleQueries.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
    },
})

export const {
    clearError,
    addConversation,
    updateConversationWithProcessedText,
    markConversationSpeechReady,
    markConversationDisplayReady,
    clearConversations,
    setVoiceSettings,
    setListeningState,
    setSpeakingState,
    setVoiceTranscript,
    setLastVoiceInput,
    updateConversationWithSpeech
} = aiSlice.actions

export default aiSlice.reducer
