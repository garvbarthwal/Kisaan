import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./slices/authSlice"
import productReducer from "./slices/productSlice"
import categoryReducer from "./slices/categorySlice"
import cartReducer from "./slices/cartSlice"
import orderReducer from "./slices/orderSlice"
import messageReducer from "./slices/messageSlice"
import farmerReducer from "./slices/farmerSlice"
import userReducer from "./slices/userSlice"
import aiReducer from "./slices/aiSlice"
import notificationReducer from "./slices/notificationSlice"
import languageReducer from "./slices/languageSlice"
import verificationReducer from "./slices/verificationSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    categories: categoryReducer,
    cart: cartReducer,
    orders: orderReducer,
    messages: messageReducer,
    farmers: farmerReducer,
    users: userReducer,
    ai: aiReducer,
    notifications: notificationReducer,
    language: languageReducer,
    verification: verificationReducer,
  },
})
