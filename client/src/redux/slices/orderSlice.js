import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { toast } from "react-toastify"
import { clearCart } from "./cartSlice"
import axiosInstance from "../../utils/axiosConfig"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Create order
export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async (orderData, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await axiosInstance.post(`/api/orders`, orderData)

      // Clear cart after successful order
      dispatch(clearCart())

      return data
    } catch (error) {
      const message = error.response && error.response.data.message ? error.response.data.message : error.message
      return rejectWithValue(message)
    }
  },
)

// Get consumer orders
export const getConsumerOrders = createAsyncThunk(
  "orders/getConsumerOrders",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/api/orders/consumer`)
      return data
    } catch (error) {
      const message = error.response && error.response.data.message ? error.response.data.message : error.message
      return rejectWithValue(message)
    }
  },
)

// Get farmer orders
export const getFarmerOrders = createAsyncThunk("orders/getFarmerOrders", async (_, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.get(`/api/orders/farmer`)
    return { data: data.data || [] } // Ensure we always return an array
  } catch (error) {
    const message = error.response && error.response.data.message ? error.response.data.message : error.message
    return rejectWithValue(message)
  }
})

// Get order details
export const getOrderDetails = createAsyncThunk("orders/getOrderDetails", async (id, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.get(`/api/orders/${id}`)
    return data
  } catch (error) {
    const message = error.response && error.response.data.message ? error.response.data.message : error.message
    return rejectWithValue(message)
  }
})

// Update order status (farmer only)
export const updateOrderStatus = createAsyncThunk(
  "orders/updateOrderStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/api/orders/${id}`, { status })
      return data
    } catch (error) {
      const message = error.response && error.response.data.message ? error.response.data.message : error.message
      return rejectWithValue(message)
    }
  },
)

// Get all orders (admin only)
export const getAllOrders = createAsyncThunk("orders/getAllOrders", async (_, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.get(`/api/orders`)
    return data
  } catch (error) {
    const message = error.response && error.response.data.message ? error.response.data.message : error.message
    return rejectWithValue(message)
  }
})

// Finalize delivery date (farmer only)
export const finalizeDeliveryDate = createAsyncThunk(
  "orders/finalizeDeliveryDate",
  async ({ id, finalizedDate, finalizedTime }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/api/orders/${id}/finalize-delivery`, {
        finalizedDate,
        finalizedTime
      });
      return data;
    } catch (error) {
      const message = error.response && error.response.data.message ? error.response.data.message : error.message;
      return rejectWithValue(message);
    }
  }
);

// Cancel order (consumer only, within 2 hours)
export const cancelOrder = createAsyncThunk(
  "orders/cancelOrder",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/api/orders/${id}/cancel`);
      return data;
    } catch (error) {
      const message = error.response && error.response.data.message ? error.response.data.message : error.message;
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  orders: [],
  farmerOrders: [],
  adminOrders: [],
  order: null,
  loading: false,
  error: null,
  success: false,
}

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearOrderError: (state) => {
      state.error = null
    },
    resetOrderSuccess: (state) => {
      state.success = false
    },
    clearOrderDetails: (state) => {
      state.order = null
    },
    resetOrderState: (state) => {
      state.order = null;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.loading = true
        state.error = null
        state.success = false
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false
        state.success = true
        state.order = action.payload.data
        toast.success("Order placed successfully!")
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })
      // Get consumer orders
      .addCase(getConsumerOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getConsumerOrders.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload.data
      })
      .addCase(getConsumerOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Get farmer orders
      .addCase(getFarmerOrders.pending, (state) => {
        state.loading = true
        state.error = null
      }).addCase(getFarmerOrders.fulfilled, (state, action) => {
        state.loading = false
        state.farmerOrders = Array.isArray(action.payload.data) ? action.payload.data : []
      })
      .addCase(getFarmerOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Get order details
      .addCase(getOrderDetails.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getOrderDetails.fulfilled, (state, action) => {
        state.loading = false
        state.order = action.payload.data
      })
      .addCase(getOrderDetails.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update order status
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false
        state.order = action.payload.data

        // Update order in farmerOrders array
        if (state.farmerOrders.length > 0) {
          state.farmerOrders = state.farmerOrders.map((order) =>
            order._id === action.payload.data._id ? action.payload.data : order,
          )
        }

        // Update order in adminOrders array
        if (state.adminOrders.length > 0) {
          state.adminOrders = state.adminOrders.map((order) =>
            order._id === action.payload.data._id ? action.payload.data : order,
          )
        }

        toast.success(`Order status updated to ${action.payload.data.status}`)
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })
      // Get all orders (admin)
      .addCase(getAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.adminOrders = action.payload.data;
      })
      .addCase(getAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Finalize delivery date
      .addCase(finalizeDeliveryDate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(finalizeDeliveryDate.fulfilled, (state, action) => {
        state.loading = false;
        state.order = action.payload.data;

        // Update order in farmerOrders array
        if (state.farmerOrders.length > 0) {
          state.farmerOrders = state.farmerOrders.map((order) =>
            order._id === action.payload.data._id ? action.payload.data : order,
          );
        }

        toast.success("Delivery date finalized successfully!");
      })
      .addCase(finalizeDeliveryDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      // Cancel order
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.order = action.payload.data;

        // Update order in orders array (consumer orders)
        if (state.orders.length > 0) {
          state.orders = state.orders.map((order) =>
            order._id === action.payload.data._id ? action.payload.data : order,
          );
        }

        toast.success("Order cancelled successfully!");
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      });
  },
})

export const { clearOrderError, resetOrderSuccess, clearOrderDetails, resetOrderState } = orderSlice.actions

export default orderSlice.reducer
