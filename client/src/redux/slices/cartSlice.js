import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { filterValidImageUrls } from "../../utils/imageCleanup";

// Get cart from localStorage
const cartItemsFromStorage = localStorage.getItem("cartItems")
  ? JSON.parse(localStorage.getItem("cartItems"))
  : [];

const initialState = {
  cartItems: cartItemsFromStorage,
  farmerId:
    cartItemsFromStorage.length > 0 ? cartItemsFromStorage[0].farmerId : null,
  farmerName:
    cartItemsFromStorage.length > 0 ? cartItemsFromStorage[0].farmerName : null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity } = action.payload;

      // Check if product is in stock
      if (product.quantityAvailable <= 0) {
        toast.error(`${product.name} is out of stock`);
        return;
      }

      // Check if requested quantity exceeds available stock
      if (quantity > product.quantityAvailable) {
        toast.error(`Only ${product.quantityAvailable} ${product.unit} available for ${product.name}`);
        return;
      }

      if (
        state.cartItems.length === 0 ||
        product.farmer._id === state.farmerId
      ) {
        const existItem = state.cartItems.find(
          (item) => item.productId === product._id
        );

        if (existItem) {
          // Check if adding this quantity would exceed available stock
          const newTotalQuantity = existItem.quantity + quantity;
          if (newTotalQuantity > product.quantityAvailable) {
            toast.error(`Cannot add ${quantity} more ${product.unit}. Only ${product.quantityAvailable - existItem.quantity} ${product.unit} remaining for ${product.name}`);
            return;
          }

          state.cartItems = state.cartItems.map((item) =>
            item.productId === product._id
              ? { ...item, quantity: newTotalQuantity }
              : item
          );
          toast.info(`Updated ${product.name} quantity in your cart`);
        } else {
          // Filter valid images before storing
          const validImages = filterValidImageUrls(product.images);

          state.cartItems.push({
            productId: product._id,
            name: product.name,
            image: validImages && validImages.length > 0 ? validImages[0] : null,
            price: product.price,
            quantity,
            unit: product.unit,
            farmerId: product.farmer._id,
            farmerName: product.farmer.name,
          });

          if (state.farmerId === null) {
            state.farmerId = product.farmer._id;
            state.farmerName = product.farmer.name;
          }

          toast.success(`Added ${product.name} to your cart`);
        }
      } else {
        toast.error(
          "You can only order from one farm at a time. Please clear your cart first."
        );
        return;
      }

      localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
    },
    removeFromCart: (state, action) => {
      const productId = action.payload;
      state.cartItems = state.cartItems.filter(
        (item) => item.productId !== productId
      );

      if (state.cartItems.length === 0) {
        state.farmerId = null;
        state.farmerName = null;
      }

      localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
      toast.info("Item removed from cart");
    },
    updateCartQuantity: (state, action) => {
      const { productId, quantity } = action.payload;

      // Find the item to update
      const item = state.cartItems.find((item) => item.productId === productId);
      if (!item) {
        toast.error("Item not found in cart");
        return;
      }

      // Note: We would need to pass the product data to validate against current stock
      // For now, we'll just ensure quantity is positive
      if (quantity <= 0) {
        toast.error("Quantity must be greater than 0");
        return;
      }

      state.cartItems = state.cartItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );

      localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
    },
    clearCart: (state) => {
      state.cartItems = [];
      state.farmerId = null;
      state.farmerName = null;

      localStorage.removeItem("cartItems");
      toast.info("Cart cleared");
    },
  },
});

export const { addToCart, removeFromCart, updateCartQuantity, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;
