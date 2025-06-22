import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axiosConfig";
import { toast } from "react-toastify";

// Create a new review
export const createReview = createAsyncThunk(
  "reviews/createReview",
  async (reviewData, { rejectWithValue }) => {
    try {
      const response = await axios.post("/api/reviews", reviewData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create review"
      );
    }
  }
);

// Get reviews for a farmer
export const getFarmerReviews = createAsyncThunk(
  "reviews/getFarmerReviews",
  async (farmerId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/reviews/farmer/${farmerId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch reviews"
      );
    }
  }
);

// Get review for a specific order
export const getOrderReview = createAsyncThunk(
  "reviews/getOrderReview",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/reviews/order/${orderId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        // Not finding a review is not an error, just return null
        return { review: null };
      }
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch review"
      );
    }
  }
);

// Update a review
export const updateReview = createAsyncThunk(
  "reviews/updateReview",
  async ({ id, reviewData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/reviews/${id}`, reviewData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update review"
      );
    }
  }
);

// Delete a review
export const deleteReview = createAsyncThunk(
  "reviews/deleteReview",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`/api/reviews/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete review"
      );
    }
  }
);

const reviewSlice = createSlice({
  name: "reviews",
  initialState: {
    farmerReviews: [],
    orderReview: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetReviewState: (state) => {
      state.error = null;
      state.success = false;
    },
    clearOrderReview: (state) => {
      state.orderReview = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create review
      .addCase(createReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.orderReview = action.payload.review;
        toast.success("Review submitted successfully");
      })
      .addCase(createReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      
      // Get farmer reviews
      .addCase(getFarmerReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFarmerReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.farmerReviews = action.payload.reviews;
      })
      .addCase(getFarmerReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get order review
      .addCase(getOrderReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrderReview.fulfilled, (state, action) => {
        state.loading = false;
        state.orderReview = action.payload.review;
      })
      .addCase(getOrderReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update review
      .addCase(updateReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.orderReview = action.payload.review;
        toast.success("Review updated successfully");
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      
      // Delete review
      .addCase(deleteReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.orderReview = null;
        state.farmerReviews = state.farmerReviews.filter(
          (review) => review._id !== action.payload.id
        );
        toast.success("Review deleted successfully");
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      });
  },
});

export const { resetReviewState, clearOrderReview } = reviewSlice.actions;
export default reviewSlice.reducer; 