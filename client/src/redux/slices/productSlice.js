import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import axiosInstance from "../../utils/axiosConfig";
import { cleanProductsImages, cleanProductImages } from "../../utils/imageCleanup";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const getProducts = createAsyncThunk(
  "products/getProducts",
  async (params = {}, { rejectWithValue }) => {
    try {
      let url = `/api/products`;

      if (Object.keys(params).length > 0) {
        const queryParams = new URLSearchParams();
        for (const key in params) {
          if (params[key]) {
            queryParams.append(key, params[key]);
          }
        }
        url += `?${queryParams.toString()}`;
      }

      const { data } = await axiosInstance.get(url);
      return data;
    } catch (error) {
      const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message;
      return rejectWithValue(message);
    }
  }
);

export const getProductDetails = createAsyncThunk(
  "products/getProductDetails",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/api/products/${id}`);
      return data;
    } catch (error) {
      const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message;
      return rejectWithValue(message);
    }
  }
);

export const getFarmerProducts = createAsyncThunk(
  "products/getFarmerProducts",
  async (_, { rejectWithValue }) => {
    try {
      // Token is automatically added by axiosInstance
      const { data } = await axiosInstance.get(`/api/products/farmer/me`);
      return data;
    } catch (error) {
      const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message;
      return rejectWithValue(message);
    }
  }
);

export const createProduct = createAsyncThunk(
  "products/createProduct",
  async (productData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        `/api/products`,
        productData
      );
      return data;
    } catch (error) {
      const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message;
      return rejectWithValue(message);
    }
  }
);

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(
        `/api/products/${id}`,
        productData
      );
      return data;
    } catch (error) {
      const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message;
      return rejectWithValue(message);
    }
  }
);

export const deleteProduct = createAsyncThunk(
  "products/deleteProduct",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/api/products/${id}`);
      return id;
    } catch (error) {
      const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message;
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  products: [],
  product: null,
  farmerProducts: [],
  loading: false,
  error: null,
  success: false,
};

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearProductError: (state) => {
      state.error = null;
    },
    resetProductSuccess: (state) => {
      state.success = false;
    },
    clearProductDetails: (state) => {
      state.product = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all products
      .addCase(getProducts.pending, (state, action) => {
        // Only set loading to true on initial load, not on filter changes
        if (!state.products.length) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.loading = false;
        // Clean any blob URLs from the products data
        state.products = cleanProductsImages(action.payload.data);
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get product details
      .addCase(getProductDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProductDetails.fulfilled, (state, action) => {
        state.loading = false;
        // Clean any blob URLs from the product data
        state.product = cleanProductImages(action.payload.data);
      })
      .addCase(getProductDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get farmer products
      .addCase(getFarmerProducts.pending, (state) => {
        // Only set loading to true if we don't already have products
        if (!state.farmerProducts.length) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(getFarmerProducts.fulfilled, (state, action) => {
        state.loading = false;
        // Clean any blob URLs from the farmer products data
        state.farmerProducts = cleanProductsImages(action.payload.data);
      })
      .addCase(getFarmerProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create product
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Clean any blob URLs from the new product data
        const cleanedProduct = cleanProductImages(action.payload.data);
        state.farmerProducts.push(cleanedProduct);
        toast.success("Product created successfully!");
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      // Update product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Clean any blob URLs from the updated product data
        const cleanedProduct = cleanProductImages(action.payload.data);
        state.farmerProducts = state.farmerProducts.map((product) =>
          product._id === cleanedProduct._id ? cleanedProduct : product
        );
        toast.success("Product updated successfully!");
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      // Delete product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.farmerProducts = state.farmerProducts.filter(
          (product) => product._id !== action.payload
        );
        toast.success("Product deleted successfully!");
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      });
  },
});

export const { clearProductError, resetProductSuccess, clearProductDetails } =
  productSlice.actions;

export default productSlice.reducer;
