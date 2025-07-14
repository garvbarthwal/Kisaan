import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  removeFromCart,
  updateCartQuantity,
} from "../redux/slices/cartSlice";
import { createOrder, resetOrderState } from "../redux/slices/orderSlice";
import { getFarmerProfile } from "../redux/slices/farmerSlice";
import { FaArrowLeft, FaLeaf, FaTrash, FaTruck, FaMapMarkerAlt, FaClock, FaInfoCircle, FaExclamationTriangle } from "react-icons/fa";
import Loader from "../components/Loader";
import LocationDetector from "../components/LocationDetector";
import { placeholder } from "../assets";
import { useCheckoutState } from "../hooks/useCheckoutState";
import { validateAddress } from "../utils/addressUtils";

// Utility function to check pickup status for a given date
const getPickupStatusForDate = (date, pickupHours) => {
  if (!date) {
    return {
      isClosed: false,
      isOpen: false,
      message: "Please select a date first",
      businessHours: null,
      timeSlots: []
    };
  }

  if (!pickupHours) {
    return {
      isClosed: false,
      isOpen: true,
      message: "Business hours not configured",
      businessHours: null,
      timeSlots: []
    };
  }

  const selectedDate = new Date(date);
  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  const dayHours = pickupHours[dayName];

  if (!dayHours || dayHours.closed || !dayHours.open || !dayHours.close) {
    return {
      isClosed: true,
      isOpen: false,
      message: "We are closed on this day. Please choose another date.",
      businessHours: null,
      timeSlots: []
    };
  }

  return {
    isClosed: false,
    isOpen: true,
    message: "",
    businessHours: dayHours,
    timeSlots: []
  };
};

// Helper function to format time for display
const formatTimeSlot = (timeSlot) => {
  if (!timeSlot) return "";
  const [hour, minute] = timeSlot.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
};

// Helper function to format time in 24-hour format
function formatTime24(timeSlot) {
  if (!timeSlot) return "";
  const [hour, minute] = timeSlot.split(":").map(Number);
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

// Helper function to validate time is within business hours
const isTimeWithinBusinessHours = (time, businessHours) => {
  if (!time || !businessHours || !businessHours.open || !businessHours.close) {
    return false;
  }

  return time >= businessHours.open && time <= businessHours.close;
};

// Remove the unnecessary generateTimeSlots function as we're implementing a direct time input approach

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // State for farmer business hours when needed
  const [farmerBusinessHours, setFarmerBusinessHours] = useState(null);
  const [isFetchingFarmerHours, setIsFetchingFarmerHours] = useState(false);

  // Use custom hook for checkout state
  const {
    orderType,
    setOrderType,
    isAddressChangeMode,
    addressDetectedInCheckout,
    availableFulfillmentOptions,
    orderDetails,
    setOrderDetails,
    handleLocationDetected,
    handleChangeAddress,
    handleCancelAddressChange,
    handleInputChange,
    handlePickupDateChange,
  } = useCheckoutState();

  const { cartItems, farmerId, farmerName } = useSelector(
    (state) => state.cart
  );
  const { user } = useSelector((state) => state.auth);
  const { loading, success, order } = useSelector((state) => state.orders);
  const { farmerProfile } = useSelector((state) => state.farmers);

  // Clear order state when component mounts
  useEffect(() => {
    dispatch(resetOrderState());
  }, [dispatch]);

  // Fetch farmer business hours when needed for pickup validation
  useEffect(() => {
    const needsBusinessHours = availableFulfillmentOptions.needsBusinessHours &&
      availableFulfillmentOptions.pickup &&
      !availableFulfillmentOptions.pickupHours &&
      farmerId &&
      !farmerBusinessHours &&
      !isFetchingFarmerHours;

    if (needsBusinessHours) {
      setIsFetchingFarmerHours(true);
      dispatch(getFarmerProfile(farmerId))
        .then((result) => {
          if (result.type === 'farmers/getFarmerProfile/fulfilled') {
            const businessHours = result.payload?.data?.farmerProfile?.businessHours;
            setFarmerBusinessHours(businessHours || null);
          }
        })
        .catch((error) => {
          console.error('Failed to fetch farmer business hours:', error);
          setFarmerBusinessHours(null);
        })
        .finally(() => {
          setIsFetchingFarmerHours(false);
        });
    }
  }, [availableFulfillmentOptions, farmerId, farmerBusinessHours, isFetchingFarmerHours, dispatch]);

  // Helper function to get the effective pickup hours (product-specific or farmer business hours)
  const getEffectivePickupHours = () => {
    if (availableFulfillmentOptions.pickupHours) {
      // Product has custom pickup hours
      return availableFulfillmentOptions.pickupHours;
    }
    if (availableFulfillmentOptions.needsBusinessHours && farmerBusinessHours) {
      // Product uses farmer's business hours
      return farmerBusinessHours;
    }
    return null;
  };

  // Redirect to order details page when order is successfully created
  useEffect(() => {
    if (success && order && order._id && cartItems.length === 0) {
      navigate(`/orders/${order._id}`);
    }
  }, [success, order, navigate, cartItems.length]);

  const handleRemoveItem = (productId) => {
    dispatch(removeFromCart(productId));
  };

  const handleQuantityChange = (productId, quantity) => {
    dispatch(updateCartQuantity({ productId, quantity }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if fulfillment options are available
    if (!availableFulfillmentOptions.delivery && !availableFulfillmentOptions.pickup) {
      alert("No fulfillment options are available for these products. Please contact the farmer.");
      return;
    }

    // Check if order type is selected
    if (!orderType) {
      alert("Please select a fulfillment option.");
      return;
    }

    // Validate based on order type
    if (orderType === "pickup") {
      if (!orderDetails.pickupDetails.date) {
        alert("Please select a pickup date.");
        return;
      }

      if (!orderDetails.pickupDetails.time) {
        alert("Please select a pickup time.");
        return;
      }

      // Validate pickup time against available hours
      if (availableFulfillmentOptions.pickup) {
        const effectivePickupHours = getEffectivePickupHours();
        if (effectivePickupHours) {
          const pickupStatus = getPickupStatusForDate(orderDetails.pickupDetails.date, effectivePickupHours);

          if (pickupStatus.isClosed) {
            alert("Pickup is not available on the selected date. Please choose a different date.");
            return;
          }

          if (pickupStatus.businessHours) {
            const selectedTime = orderDetails.pickupDetails.time;
            if (!isTimeWithinBusinessHours(selectedTime, pickupStatus.businessHours)) {
              alert(`Pickup time must be between ${formatTimeSlot(pickupStatus.businessHours.open)} and ${formatTimeSlot(pickupStatus.businessHours.close)} on ${new Date(orderDetails.pickupDetails.date).toLocaleDateString('en-US', { weekday: 'long' })}s.`);
              return;
            }
          }
        }
      }
    } else if (orderType === "delivery") {
      // Use address validation utility
      const addressValidation = validateAddress(orderDetails.deliveryDetails.address);
      if (!addressValidation.isValid) {
        alert(`Please fill in all required delivery address fields: ${addressValidation.missingFields.join(', ')}`);
        return;
      }

      if (!orderDetails.deliveryDetails.date || !orderDetails.deliveryDetails.time) {
        alert("Please fill in delivery date and time");
        return;
      }
    }

    // Convert cart items to the format expected by the backend
    const items = cartItems.map(item => ({
      product: item.productId,
      quantity: item.quantity,
      price: item.price
    }));

    // Prepare order details with proper formatting
    const orderDetailsToSend = {};

    if (orderType === "pickup") {
      orderDetailsToSend.pickupDetails = {
        ...orderDetails.pickupDetails,
        date: orderDetails.pickupDetails.date || null
      };
    } else {
      orderDetailsToSend.deliveryDetails = {
        address: orderDetails.deliveryDetails.address,
        requestedDate: orderDetails.deliveryDetails.date || null,
        requestedTime: orderDetails.deliveryDetails.time || "",
        finalizedDate: null,
        finalizedTime: "",
        isDateFinalized: false
      };
    }

    const orderData = {
      farmer: farmerId,
      items,
      ...orderDetailsToSend,
      paymentMethod: orderDetails.paymentMethod,
      notes: orderDetails.notes,
    };

    dispatch(createOrder(orderData));
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8 text-center">
          <FaLeaf className="text-green-600 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">
            Add some products to your cart to proceed with checkout.
          </p>
          <button
            onClick={() => navigate("/products")}
            className="btn btn-primary px-6 py-2"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center mb-8 text-gray-600 hover:text-green-700"
      >
        <FaArrowLeft className="mr-2" />
        Back
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-7/12">
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">Your Cart</h2>

            {cartItems.length > 0 && (
              <div className="mb-4">
                <p className="text-gray-600">
                  Items from: <strong>{farmerName}</strong>
                </p>
              </div>
            )}

            <div className="border-b border-gray-200 pb-4 mb-4">
              {cartItems.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between py-4 border-b border-gray-100"
                >
                  <div className="flex items-center">
                    <div className="w-16 h-16 rounded-lg overflow-hidden">
                      <img
                        src={
                          item.image ||
                          (item.images && item.images.length > 0
                            ? item.images[0]
                            : placeholder)
                        }
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = placeholder;
                        }}
                      />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        ₹{item.price}/{item.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center border rounded-md overflow-hidden">
                      <button
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                        onClick={() =>
                          handleQuantityChange(
                            item.productId,
                            Math.max(1, item.quantity - 1)
                          )
                        }
                      >
                        -
                      </button>
                      <span className="px-4 py-1">{item.quantity}</span>
                      <button
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                        onClick={() =>
                          handleQuantityChange(item.productId, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleRemoveItem(item.productId)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <span className="font-semibold">Total:</span>
              <span className="text-2xl font-bold text-green-700">
                ₹{calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:w-5/12">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Order Details</h2>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Order Summary</h3>
              <p className="text-sm text-blue-700">
                {orderType === "pickup"
                  ? orderDetails.pickupDetails.date && orderDetails.pickupDetails.time
                    ? `Pickup scheduled for ${new Date(orderDetails.pickupDetails.date).toLocaleDateString()} at ${formatTimeSlot(orderDetails.pickupDetails.time)} from farmer's location.`
                    : "Please select pickup date and time. Pickup will be at the farmer's location."
                  : orderType === "delivery"
                    ? "Please provide delivery address, date, and time details."
                    : "Please select a fulfillment option and provide the required details."
                }
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Fulfillment Options Section */}
              <div className="mb-6">
                <label className="text-gray-700 font-medium mb-3 block">
                  Fulfillment Options *
                </label>

                {!availableFulfillmentOptions.delivery && !availableFulfillmentOptions.pickup ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FaExclamationTriangle className="text-red-500" />
                      <p className="text-red-700 font-medium">No fulfillment options available</p>
                    </div>
                    <p className="text-red-600 text-sm mt-1">
                      The farmer has not configured delivery or pickup options for these products.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pickup Option */}
                    {availableFulfillmentOptions.pickup && (
                      <div className={`group relative p-4 border-2 rounded-xl transition-all duration-300 cursor-pointer hover:shadow-md ${orderType === "pickup"
                        ? 'border-green-500 bg-green-50 shadow-sm'
                        : 'border-gray-200 hover:border-green-300'
                        }`}>
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <input
                              type="radio"
                              id="pickup"
                              name="orderType"
                              value="pickup"
                              checked={orderType === "pickup"}
                              onChange={() => setOrderType("pickup")}
                              className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300"
                            />
                          </div>
                          <div className="flex items-center space-x-3 flex-1">
                            <div className={`p-2 rounded-lg transition-colors ${orderType === "pickup"
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-green-600 group-hover:bg-green-100'
                              }`}>
                              <FaMapMarkerAlt className="text-lg" />
                            </div>
                            <div className="flex-1">
                              <label htmlFor="pickup" className="block text-sm font-semibold text-gray-900 cursor-pointer">
                                Pickup
                              </label>
                              <p className="text-xs text-gray-500 mt-1">
                                Pick up from farmer's location
                              </p>
                            </div>
                          </div>
                        </div>


                      </div>
                    )}

                    {/* Delivery Option */}
                    {availableFulfillmentOptions.delivery && (
                      <div className={`group relative p-4 border-2 rounded-xl transition-all duration-300 cursor-pointer hover:shadow-md ${orderType === "delivery"
                        ? 'border-green-500 bg-green-50 shadow-sm'
                        : 'border-gray-200 hover:border-green-300'
                        }`}>
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <input
                              type="radio"
                              id="delivery"
                              name="orderType"
                              value="delivery"
                              checked={orderType === "delivery"}
                              onChange={() => setOrderType("delivery")}
                              className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300"
                            />
                          </div>
                          <div className="flex items-center space-x-3 flex-1">
                            <div className={`p-2 rounded-lg transition-colors ${orderType === "delivery"
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-green-600 group-hover:bg-green-100'
                              }`}>
                              <FaTruck className="text-lg" />
                            </div>
                            <div>
                              <label htmlFor="delivery" className="block text-sm font-semibold text-gray-900 cursor-pointer">
                                Delivery
                              </label>
                              <p className="text-xs text-gray-500 mt-1">
                                Farmer will deliver to you
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Show available options info */}
                {(availableFulfillmentOptions.delivery || availableFulfillmentOptions.pickup) && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FaInfoCircle className="text-blue-500 text-sm" />
                      <span className="text-blue-700 text-sm font-medium">Available Options:</span>
                    </div>
                    <p className="text-blue-600 text-sm mt-1">
                      {availableFulfillmentOptions.pickup && availableFulfillmentOptions.delivery
                        ? "Both pickup and delivery are available for your order."
                        : availableFulfillmentOptions.pickup
                          ? "Only pickup is available for your order."
                          : "Only delivery is available for your order."
                      }
                    </p>
                  </div>
                )}

                {/* Pickup Hours Display - Show only when pickup is selected */}
                {orderType === "pickup" && getEffectivePickupHours() && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <FaClock className="text-green-600 text-lg" />
                      <span className="text-green-700 font-semibold">Pickup Hours</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                      {Object.entries(getEffectivePickupHours()).map(([day, hours]) => (
                        <div key={day} className="flex flex-col items-start">
                          <span className="capitalize text-gray-600 mb-1">{day.slice(0, 3)}</span>
                          <span className={`font-medium ${hours.closed ? 'text-red-500' : 'text-green-600'}`}>
                            {hours.closed
                              ? 'Closed'
                              : `${formatTime24(hours.open)} - ${formatTime24(hours.close)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-green-600 text-xs mt-2 italic">
                      Please select a pickup date and time within these hours.
                    </p>
                  </div>
                )}

                {/* Loading indicator for business hours */}
                {orderType === "pickup" && availableFulfillmentOptions.needsBusinessHours && isFetchingFarmerHours && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-blue-700 text-sm">Loading pickup hours...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Fields - Only show if fulfillment options are available */}
              {(availableFulfillmentOptions.delivery || availableFulfillmentOptions.pickup) && orderType && (
                <>
                  {orderType === "pickup" ? (
                    <div className="space-y-4">
                      <div>
                        <label
                          className="block text-gray-700 font-medium mb-2"
                          htmlFor="pickupDate"
                        >
                          Pickup Date *
                        </label>
                        <input
                          type="date"
                          id="pickupDate"
                          name="pickupDetails.date"
                          value={orderDetails.pickupDetails.date}
                          onChange={handlePickupDateChange}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                          required
                        />
                        {/* Show pickup availability for selected date */}
                        {orderDetails.pickupDetails.date && getEffectivePickupHours() && (
                          <div className="mt-2">
                            {(() => {
                              const effectivePickupHours = getEffectivePickupHours();
                              const pickupStatus = getPickupStatusForDate(orderDetails.pickupDetails.date, effectivePickupHours);

                              if (pickupStatus.isClosed) {
                                return (
                                  <div className="flex items-center space-x-2 text-sm">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span className="text-red-600">Farmer is closed on this day</span>
                                  </div>
                                );
                              }

                              if (pickupStatus.businessHours) {
                                return (
                                  <div className="flex items-center space-x-2 text-sm">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-green-600">Available: {formatTimeSlot(pickupStatus.businessHours.open)} - {formatTimeSlot(pickupStatus.businessHours.close)}</span>
                                  </div>
                                );
                              }

                              return (
                                <div className="flex items-center space-x-2 text-sm">
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                  <span className="text-yellow-600">Business hours not configured</span>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      <div>
                        <label
                          className="block text-gray-700 font-medium mb-2"
                          htmlFor="pickupTime"
                        >
                          Pickup Time *
                        </label>

                        {(() => {
                          const effectivePickupHours = getEffectivePickupHours();
                          const pickupStatus = getPickupStatusForDate(orderDetails.pickupDetails.date, effectivePickupHours);

                          if (!orderDetails.pickupDetails.date) {
                            return (
                              <div className="w-full p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <FaInfoCircle className="text-blue-500 text-sm" />
                                  <p className="text-blue-700 font-medium text-sm">
                                    Please select a pickup date first
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          if (pickupStatus.isClosed) {
                            return (
                              <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <p className="text-red-700 font-medium text-sm">
                                    {pickupStatus.message}
                                  </p>
                                </div>
                                <p className="text-red-600 text-xs mt-1">
                                  Please select a different date when the farmer is available.
                                </p>
                              </div>
                            );
                          }

                          if (pickupStatus.businessHours) {
                            return (
                              <div className="space-y-3">
                                {/* Time input */}
                                <div>
                                  <input
                                    type="time"
                                    id="pickupTime"
                                    name="pickupDetails.time"
                                    value={orderDetails.pickupDetails.time}
                                    min={pickupStatus.businessHours.open}
                                    max={pickupStatus.businessHours.close}
                                    onChange={handleInputChange}
                                    className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                                    placeholder="Select pickup time"
                                    required
                                  />

                                  {/* Validation feedback */}
                                  {orderDetails.pickupDetails.time && (
                                    <div className="mt-2">
                                      {isTimeWithinBusinessHours(orderDetails.pickupDetails.time, pickupStatus.businessHours) ? (
                                        <div className="flex items-center space-x-2 text-sm text-green-600">
                                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                          <span>Valid pickup time: {formatTimeSlot(orderDetails.pickupDetails.time)}</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center space-x-2 text-sm text-red-600">
                                          <FaExclamationTriangle className="text-red-500 text-xs" />
                                          <span>
                                            Time must be between {formatTimeSlot(pickupStatus.businessHours.open)} and {formatTimeSlot(pickupStatus.businessHours.close)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <FaInfoCircle className="text-yellow-600 text-sm" />
                                <p className="text-yellow-700 font-medium text-sm">
                                  Business hours not configured for this farmer
                                </p>
                              </div>
                              <input
                                type="time"
                                id="pickupTime"
                                name="pickupDetails.time"
                                value={orderDetails.pickupDetails.time}
                                onChange={handleInputChange}
                                className="w-full mt-2 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                                required
                              />
                            </div>
                          );
                        })()}
                      </div>

                      <div>
                        <label
                          className="block text-gray-700 font-medium mb-2"
                          htmlFor="pickupLocation"
                        >
                          Pickup Location
                        </label>
                        <div className="w-full p-3 bg-gray-100 rounded-lg border border-gray-200 text-gray-700">
                          Pickup will be at the farmer's location
                        </div>
                        <input
                          type="hidden"
                          id="pickupLocation"
                          name="pickupDetails.location"
                          value="Farmer's Location"
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                        <h3 className="text-lg font-medium text-gray-700">
                          Delivery Address
                        </h3>
                        <div className="flex items-center gap-2">
                          {!isAddressChangeMode && (
                            <button
                              type="button"
                              onClick={handleChangeAddress}
                              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                            >
                              <FaMapMarkerAlt className="text-xs" />
                              Change Address
                            </button>
                          )}
                          {isAddressChangeMode && (
                            <div className="flex items-center gap-2">
                              <LocationDetector
                                onLocationDetected={handleLocationDetected}
                                isLoading={loading}
                                variant="compact"
                              />
                              <button
                                type="button"
                                onClick={handleCancelAddressChange}
                                className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Location detection prompt - only show when in change address mode */}
                      {isAddressChangeMode && !orderDetails.deliveryDetails.address.coordinates && (
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                          <div className="flex items-start gap-2">
                            <div className="w-4 h-4 text-amber-600 mt-0.5">📍</div>
                            <div>
                              <p className="text-sm text-amber-800 font-medium">
                                Detect Your Location
                              </p>
                              <p className="text-xs text-amber-700 mt-1">
                                Click the "Detect Location" button above for accurate GPS coordinates to ensure precise delivery to your exact location.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Success message - only show when location detected during checkout */}
                      {addressDetectedInCheckout && orderDetails.deliveryDetails.address.coordinates && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <p className="text-sm text-green-700 font-medium">
                              ✓ Exact delivery location detected
                            </p>
                          </div>
                          <p className="text-xs text-green-600 mt-1">
                            Your precise coordinates have been saved for accurate delivery.
                            The exact coordinates are securely stored and not visible to others.
                          </p>
                        </div>
                      )}

                      <div>
                        <label
                          className="block text-gray-700 font-medium mb-2"
                          htmlFor="street"
                        >
                          Street Address {isAddressChangeMode && <span className="text-xs text-green-600 font-normal">(editable)</span>}
                        </label>
                        <div className={`relative ${isAddressChangeMode ? 'border-2 border-green-400 border-dashed rounded-lg p-1' : ''}`}>
                          <input
                            type="text"
                            id="street"
                            name="deliveryDetails.address.street"
                            value={orderDetails.deliveryDetails.address.street}
                            onChange={handleInputChange}
                            placeholder="Enter your street address"
                            className={`w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500 ${!isAddressChangeMode ? 'bg-gray-50' : 'bg-white'
                              }`}
                            disabled={!isAddressChangeMode}
                            required
                          />
                          {isAddressChangeMode && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                              ✏️
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            className="block text-gray-700 font-medium mb-2"
                            htmlFor="city"
                          >
                            City {isAddressChangeMode && <span className="text-xs text-green-600 font-normal">(editable)</span>}
                          </label>
                          <div className={`relative ${isAddressChangeMode ? 'border-2 border-green-400 border-dashed rounded-lg p-1' : ''}`}>
                            <input
                              type="text"
                              id="city"
                              name="deliveryDetails.address.city"
                              value={orderDetails.deliveryDetails.address.city}
                              onChange={handleInputChange}
                              placeholder="Enter city"
                              className={`w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500 ${!isAddressChangeMode ? 'bg-gray-50' : 'bg-white'
                                }`}
                              disabled={!isAddressChangeMode}
                              required
                            />
                            {isAddressChangeMode && (
                              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                ✏️
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label
                            className="block text-gray-700 font-medium mb-2"
                            htmlFor="state"
                          >
                            State {isAddressChangeMode && <span className="text-xs text-green-600 font-normal">(editable)</span>}
                          </label>
                          <div className={`relative ${isAddressChangeMode ? 'border-2 border-green-400 border-dashed rounded-lg p-1' : ''}`}>
                            <input
                              type="text"
                              id="state"
                              name="deliveryDetails.address.state"
                              value={orderDetails.deliveryDetails.address.state}
                              onChange={handleInputChange}
                              placeholder="Enter state"
                              className={`w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500 ${!isAddressChangeMode ? 'bg-gray-50' : 'bg-white'
                                }`}
                              disabled={!isAddressChangeMode}
                              required
                            />
                            {isAddressChangeMode && (
                              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                ✏️
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label
                          className="block text-gray-700 font-medium mb-2"
                          htmlFor="zipCode"
                        >
                          ZIP Code {isAddressChangeMode && <span className="text-xs text-green-600 font-normal">(editable)</span>}
                        </label>
                        <div className={`relative ${isAddressChangeMode ? 'border-2 border-green-400 border-dashed rounded-lg p-1' : ''}`}>
                          <input
                            type="text"
                            id="zipCode"
                            name="deliveryDetails.address.zipCode"
                            value={orderDetails.deliveryDetails.address.zipCode}
                            onChange={handleInputChange}
                            placeholder="Enter ZIP code"
                            className={`w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500 ${!isAddressChangeMode ? 'bg-gray-50' : 'bg-white'
                              }`}
                            disabled={!isAddressChangeMode}
                            required
                          />
                          {isAddressChangeMode && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                              ✏️
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label
                          className="block text-gray-700 font-medium mb-2"
                          htmlFor="deliveryDate"
                        >
                          Delivery Date
                        </label>
                        <input
                          type="date"
                          id="deliveryDate"
                          name="deliveryDetails.date"
                          value={orderDetails.deliveryDetails.date}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>

                      <div>
                        <label
                          className="block text-gray-700 font-medium mb-2"
                          htmlFor="deliveryTime"
                        >
                          Delivery Time
                        </label>
                        <input
                          type="time"
                          id="deliveryTime"
                          name="deliveryDetails.time"
                          value={orderDetails.deliveryDetails.time}
                          onChange={(e) => {
                            setOrderDetails({
                              ...orderDetails,
                              deliveryDetails: {
                                ...orderDetails.deliveryDetails,
                                time: e.target.value
                              }
                            });
                          }}
                          className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>
                    </div>)}
                </>
              )}

              <div className="mt-6">
                <label
                  className="block text-gray-700 font-medium mb-2"
                  htmlFor="paymentMethod"
                >
                  Payment Method
                </label>
                <div className="w-full rounded-lg border-gray-300 bg-gray-100 p-3">
                  COD - currently accepting cash payments only
                </div>
              </div>

              <div className="mt-6">
                <label
                  className="block text-gray-700 font-medium mb-2"
                  htmlFor="notes"
                >
                  Order Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={orderDetails.notes}
                  onChange={handleInputChange}
                  placeholder="Any special instructions for your order..."
                  rows="3"
                  className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                ></textarea>
              </div>

              <div className="mt-8">
                {(() => {
                  let isFormValid = true;
                  let validationMessages = [];

                  // Check if fulfillment options are available
                  if (!availableFulfillmentOptions.delivery && !availableFulfillmentOptions.pickup) {
                    isFormValid = false;
                    validationMessages.push("No fulfillment options available");
                  }

                  // Check order type selection
                  if (!orderType) {
                    isFormValid = false;
                    validationMessages.push("Please select a fulfillment option");
                  }

                  // Validate pickup details
                  if (orderType === "pickup") {
                    if (!orderDetails.pickupDetails.date) {
                      isFormValid = false;
                      validationMessages.push("Please select a pickup date");
                    }

                    if (!orderDetails.pickupDetails.time) {
                      isFormValid = false;
                      validationMessages.push("Please select a pickup time");
                    }

                    // Check if time is within business hours
                    if (orderDetails.pickupDetails.date && orderDetails.pickupDetails.time) {
                      const effectivePickupHours = getEffectivePickupHours();
                      if (effectivePickupHours) {
                        const pickupStatus = getPickupStatusForDate(orderDetails.pickupDetails.date, effectivePickupHours);
                        if (pickupStatus.isClosed) {
                          isFormValid = false;
                          validationMessages.push("Farmer is closed on selected date");
                        } else if (pickupStatus.businessHours && !isTimeWithinBusinessHours(orderDetails.pickupDetails.time, pickupStatus.businessHours)) {
                          isFormValid = false;
                          validationMessages.push(`Time must be between ${formatTimeSlot(pickupStatus.businessHours.open)} and ${formatTimeSlot(pickupStatus.businessHours.close)}`);
                        }
                      }
                    }

                    // Additional validation for selected date - ensure farmer is open
                    if (orderDetails.pickupDetails.date) {
                      const effectivePickupHours = getEffectivePickupHours();
                      if (effectivePickupHours) {
                        const pickupStatus = getPickupStatusForDate(orderDetails.pickupDetails.date, effectivePickupHours);
                        if (pickupStatus.isClosed) {
                          isFormValid = false;
                          validationMessages.push("Please select a date when the farmer is open");
                        }
                      }
                    }
                  }

                  // Validate delivery details
                  if (orderType === "delivery") {
                    const addressValidation = validateAddress(orderDetails.deliveryDetails.address);
                    if (!addressValidation.isValid) {
                      isFormValid = false;
                      validationMessages.push(`Missing address fields: ${addressValidation.missingFields.join(', ')}`);
                    }
                    if (!orderDetails.deliveryDetails.date) {
                      isFormValid = false;
                      validationMessages.push("Please select a delivery date");
                    }
                    if (!orderDetails.deliveryDetails.time) {
                      isFormValid = false;
                      validationMessages.push("Please select a delivery time");
                    }
                  }

                  return (
                    <div>
                      <button
                        type="submit"
                        disabled={loading || !isFormValid}
                        className={`w-full font-bold py-3 px-6 rounded-xl text-lg transition-colors ${isFormValid && !loading
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          }`}
                      >
                        {loading ? "Placing Order..." : "Place Order"}
                      </button>

                      {cartItems.length > 0 && (
                        <p className="text-sm text-gray-600 mt-2 text-center">
                          Total: ₹{calculateTotal().toFixed(2)}
                        </p>
                      )}

                      {validationMessages.length > 0 && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <FaExclamationTriangle className="text-red-500 text-sm mt-0.5" />
                            <div>
                              <p className="text-red-700 font-medium text-sm mb-1">Please complete the following:</p>
                              <ul className="text-red-600 text-xs space-y-1">
                                {validationMessages.map((message, index) => (
                                  <li key={index}>• {message}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
