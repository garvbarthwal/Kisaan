import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"
import { useEffect } from "react"
import Loader from "./Loader"
import { toast } from "react-toastify"

const ConsumerRoute = () => {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth)
  const { cartItems } = useSelector((state) => state.cart)
  const location = useLocation()

  // Handle empty cart toast message as a side effect
  useEffect(() => {
    if (location.pathname === "/checkout" && cartItems.length === 0) {
      toast.info("Your cart is empty. Please add items to your cart first.")
    }
  }, [location.pathname, cartItems.length])

  if (loading) {
    return <Loader />
  }

  // If not authenticated or not a consumer, redirect to login
  if (!isAuthenticated || user?.role !== "consumer") {
    return <Navigate to="/login" />
  }

  // If trying to access checkout but cart is empty, redirect to products
  if (location.pathname === "/checkout" && cartItems.length === 0) {
    return <Navigate to="/products" />
  }

  return <Outlet />
}

export default ConsumerRoute
