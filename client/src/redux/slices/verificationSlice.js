import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

// Verify farmer using government data
export const verifyFarmer = createAsyncThunk(
    'verification/verifyFarmer',
    async (verificationData, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post('/api/verification/verify-farmer', verificationData);
            return data;
        } catch (error) {
            const message = error.response && error.response.data.message
                ? error.response.data.message
                : error.message;
            return rejectWithValue(message);
        }
    }
);

// Get verification status
export const getVerificationStatus = createAsyncThunk(
    'verification/getStatus',
    async (_, { rejectWithValue, getState }) => {
        try {
            // Check if user is authenticated and is a farmer
            const { auth } = getState();
            if (!auth.isAuthenticated || !auth.token || auth.user?.role !== "farmer") {
                return rejectWithValue("User not authenticated or not a farmer");
            }

            const { data } = await axiosInstance.get('/api/verification/status');
            return data;
        } catch (error) {
            const message = error.response && error.response.data.message
                ? error.response.data.message
                : error.message;
            return rejectWithValue(message);
        }
    }
);

// Request manual verification
export const requestManualVerification = createAsyncThunk(
    'verification/requestManual',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post('/api/verification/manual-request');
            return data;
        } catch (error) {
            const message = error.response && error.response.data.message
                ? error.response.data.message
                : error.message;
            return rejectWithValue(message);
        }
    }
);

// Verify OTP
export const verifyOTP = createAsyncThunk(
    'verification/verifyOTP',
    async (otpData, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post('/api/verification/verify-otp', otpData);
            return data;
        } catch (error) {
            const message = error.response && error.response.data.message
                ? error.response.data.message
                : error.message;
            return rejectWithValue(message);
        }
    }
);

// Resend OTP
export const resendOTP = createAsyncThunk(
    'verification/resendOTP',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post('/api/verification/resend-otp');
            return data;
        } catch (error) {
            const message = error.response && error.response.data.message
                ? error.response.data.message
                : error.message;
            return rejectWithValue(message);
        }
    }
);

const initialState = {
    isVerified: false,
    hasProfile: false,
    loading: false,
    verifying: false,
    verifyingOTP: false,
    resendingOTP: false,
    otpSent: false,
    error: null,
    success: false,
    verificationMessage: null,
    maskedMobile: null,
    otpExpiresIn: null
};

const verificationSlice = createSlice({
    name: 'verification',
    initialState,
    reducers: {
        clearVerificationError: (state) => {
            state.error = null;
        },
        clearVerificationSuccess: (state) => {
            state.success = false;
            state.verificationMessage = null;
            state.otpSent = false;
        },
        resetVerificationState: (state) => {
            state.error = null;
            state.success = false;
            state.verificationMessage = null;
            state.verifying = false;
            state.verifyingOTP = false;
            state.resendingOTP = false;
            state.otpSent = false;
            state.maskedMobile = null;
            state.otpExpiresIn = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Verify farmer (Step 1: Send OTP)
            .addCase(verifyFarmer.pending, (state) => {
                state.verifying = true;
                state.error = null;
                state.success = false;
                state.otpSent = false;
            })
            .addCase(verifyFarmer.fulfilled, (state, action) => {
                state.verifying = false;
                state.otpSent = action.payload.data.otpSent;
                state.maskedMobile = action.payload.data.mobile;
                state.otpExpiresIn = action.payload.data.expiresIn;
                state.verificationMessage = action.payload.message;
                toast.success(action.payload.message);
            })
            .addCase(verifyFarmer.rejected, (state, action) => {
                state.verifying = false;
                state.error = action.payload;
                state.otpSent = false;
                toast.error(action.payload || 'Failed to send OTP');
            })

            // Get verification status
            .addCase(getVerificationStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getVerificationStatus.fulfilled, (state, action) => {
                state.loading = false;
                state.isVerified = action.payload.data.isVerified;
                state.hasProfile = action.payload.data.hasProfile;
            })
            .addCase(getVerificationStatus.rejected, (state, action) => {
                state.loading = false;
                // Don't set error for authentication issues
                if (action.payload !== "User not authenticated or not a farmer") {
                    state.error = action.payload;
                }
            })

            // Request manual verification
            .addCase(requestManualVerification.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(requestManualVerification.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.verificationMessage = action.payload.message;
                toast.success(action.payload.message);
            })
            .addCase(requestManualVerification.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                toast.error(action.payload || 'Failed to submit manual verification request');
            })

            // Verify OTP (Step 2: Complete verification)
            .addCase(verifyOTP.pending, (state) => {
                state.verifyingOTP = true;
                state.error = null;
            })
            .addCase(verifyOTP.fulfilled, (state, action) => {
                state.verifyingOTP = false;
                state.success = true;
                state.isVerified = action.payload.data.isVerified;
                state.verificationMessage = action.payload.message;
                state.otpSent = false;
                state.maskedMobile = null;
                state.otpExpiresIn = null;
                toast.success(action.payload.message);
            })
            .addCase(verifyOTP.rejected, (state, action) => {
                state.verifyingOTP = false;
                state.error = action.payload;
                toast.error(action.payload || 'OTP verification failed');
            })

            // Resend OTP
            .addCase(resendOTP.pending, (state) => {
                state.resendingOTP = true;
                state.error = null;
            })
            .addCase(resendOTP.fulfilled, (state, action) => {
                state.resendingOTP = false;
                state.maskedMobile = action.payload.data.mobile;
                state.otpExpiresIn = action.payload.data.expiresIn;
                state.verificationMessage = action.payload.message;
                toast.success(action.payload.message);
            })
            .addCase(resendOTP.rejected, (state, action) => {
                state.resendingOTP = false;
                state.error = action.payload;
                toast.error(action.payload || 'Failed to resend OTP');
            });
    }
});

export const {
    clearVerificationError,
    clearVerificationSuccess,
    resetVerificationState
} = verificationSlice.actions;

export default verificationSlice.reducer;
