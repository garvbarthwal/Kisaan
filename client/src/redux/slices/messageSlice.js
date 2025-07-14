import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import axiosInstance from "../../utils/axiosConfig";

// Send message
export const sendMessage = createAsyncThunk(
  "messages/sendMessage",
  async (messageData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`/api/messages`, messageData)
      return data
    } catch (error) {
      const message = error.response && error.response.data.message ? error.response.data.message : error.message
      return rejectWithValue(message)
    }
  },
)

// Get conversations
export const getConversations = createAsyncThunk(
  "messages/getConversations",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/api/messages`)
      return data
    } catch (error) {
      const message = error.response && error.response.data.message ? error.response.data.message : error.message
      return rejectWithValue(message)
    }
  },
)

// Get conversation messages
export const getConversationMessages = createAsyncThunk(
  "messages/getConversationMessages",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/api/messages/${userId}`)
      return { data, userId }
    } catch (error) {
      const message = error.response && error.response.data.message ? error.response.data.message : error.message
      return rejectWithValue(message)
    }
  },
)

// Mark messages as read
export const markMessagesAsRead = createAsyncThunk(
  "messages/markMessagesAsRead",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/api/messages/read/${userId}`, {})
      return { data, userId }
    } catch (error) {
      const message = error.response && error.response.data.message ? error.response.data.message : error.message
      return rejectWithValue(message)
    }
  },
)

const initialState = {
  conversations: [],
  messages: {},
  currentConversation: null,
  loading: false,
  error: null,
}

const messageSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    clearMessageError: (state) => {
      state.error = null
    },
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true
        state.error = null
      }).addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false

        const { receiver, sender } = action.payload.data
        const receiverId = receiver._id || receiver

        // Get current user from state.messages for the current conversation
        const currentConversation = state.messages[receiverId]
        const currentUserInfo = currentConversation && currentConversation.length > 0
          ? (currentConversation[0].sender._id === sender
            ? currentConversation[0].sender
            : currentConversation[0].receiver)
          : null

        // Create a properly formatted message with populated sender/receiver
        const formattedMessage = {
          ...action.payload.data,
          sender: typeof sender === 'object' ? sender : {
            _id: sender,
            // If we have current user info from previous messages, use it
            ...(currentUserInfo && currentUserInfo._id === sender ? currentUserInfo : {})
          }
        }

        // Add message to conversation
        if (state.messages[receiverId]) {
          state.messages[receiverId].push(formattedMessage)
        } else {
          state.messages[receiverId] = [formattedMessage]
        }

        // Update the conversations list with the new message
        const conversationIndex = state.conversations.findIndex(
          conv => conv.user._id === receiverId || conv._id === receiverId
        )

        if (conversationIndex !== -1) {
          // Update existing conversation with latest message
          state.conversations[conversationIndex].latestMessage = action.payload.data
          state.conversations[conversationIndex].updatedAt = new Date().toISOString()

          // Move this conversation to the top
          const updatedConversation = state.conversations[conversationIndex]
          state.conversations.splice(conversationIndex, 1)
          state.conversations.unshift(updatedConversation)
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })
      // Get conversations
      .addCase(getConversations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getConversations.fulfilled, (state, action) => {
        state.loading = false

        // Update conversations with new data, preserving any local state we need
        const newConversations = action.payload.data

        // Sort conversations by most recent first
        state.conversations = newConversations.sort((a, b) => {
          return new Date(b.updatedAt) - new Date(a.updatedAt)
        })

        // Update any currently loaded messages with new unread counts
        if (state.currentConversation) {
          const currentConv = newConversations.find(
            conv => conv.user._id === state.currentConversation
          )
          if (currentConv) {
            // Update the current conversation's unread count
            const index = state.conversations.findIndex(
              conv => conv.user._id === state.currentConversation
            )
            if (index !== -1) {
              state.conversations[index].unreadCount = currentConv.unreadCount
            }
          }
        }
      })
      .addCase(getConversations.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Get conversation messages
      .addCase(getConversationMessages.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getConversationMessages.fulfilled, (state, action) => {
        state.loading = false
        state.messages[action.payload.userId] = action.payload.data.data
      })
      .addCase(getConversationMessages.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Mark messages as read
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        // Update unread count in conversations
        state.conversations = state.conversations.map((conversation) => {
          if (conversation.user._id === action.payload.userId) {
            return { ...conversation, unreadCount: 0 }
          }
          return conversation
        })

        // Update isRead status in messages
        if (state.messages[action.payload.userId]) {
          state.messages[action.payload.userId] = state.messages[action.payload.userId].map((message) => {
            if (message.sender._id === action.payload.userId && !message.isRead) {
              return { ...message, isRead: true }
            }
            return message
          })
        }
      })
  },
})

export const { clearMessageError, setCurrentConversation } = messageSlice.actions

export default messageSlice.reducer
