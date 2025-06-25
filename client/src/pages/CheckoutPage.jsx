import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  removeFromCart,
  updateCartQuantity,
  clearCart,
} from "../redux/slices/cartSlice";
import { createOrder, resetOrderState } from "../redux/slices/orderSlice";
import { FaArrowLeft, FaLeaf, FaTrash } from "react-icons/fa";
import Loader from "../components/Loader";
import { placeholder } from "../assets";

const CheckoutPage = () => {
  const [orderType, setOrderType] = useState("pickup");
  const [orderDetails, setOrderDetails] = useState({
    pickupDetails: {
      date: "",
      time: "",
      location: "Farmer's Location",
    },
    deliveryDetails: {
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
      },
      date: "",
      time: "",
    },
    paymentMethod: "cash",
    notes: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { cartItems, farmerId, farmerName } = useSelector(
    (state) => state.cart
  );
  const { user } = useSelector((state) => state.auth);
  const { loading, success, order } = useSelector((state) => state.orders);

  // Clear order state when component mounts
  useEffect(() => {
    dispatch(resetOrderState());
  }, [dispatch]);

  useEffect(() => {
    if (success && order && order._id && cartItems.length === 0) {
      navigate(`/orders/${order._id}`);
    }
  }, [success, order, navigate, cartItems.length]);

  useEffect(() => {
    if (user && user.address) {
      setOrderDetails((prev) => ({
        ...prev,
        deliveryDetails: {
          ...prev.deliveryDetails,
          address: {
            street: user.address.street || "",
            city: user.address.city || "",
            state: user.address.state || "",
            zipCode: user.address.zipCode || "",
          },
        },
      }));
    }
  }, [user]);

  // Set default date and time for pickup/delivery
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];

    setOrderDetails(prev => ({
      ...prev,
      pickupDetails: {
        ...prev.pickupDetails,
        date: prev.pickupDetails.date || tomorrowString,
        time: prev.pickupDetails.time || "10:00"
      },
      deliveryDetails: {
        ...prev.deliveryDetails,
        date: prev.deliveryDetails.date || tomorrowString,
        time: prev.deliveryDetails.time || "10:00"
      }
    }));
  }, []);

  const handleRemoveItem = (productId) => {
    dispatch(removeFromCart(productId));
  };

  const handleQuantityChange = (productId, quantity) => {
    dispatch(updateCartQuantity({ productId, quantity }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`);

    if (name.includes(".")) {
      const [parent, child, grandchild] = name.split(".");

      if (grandchild) {
        setOrderDetails({
          ...orderDetails,
          [parent]: {
            ...orderDetails[parent],
            [child]: {
              ...orderDetails[parent][child],
              [grandchild]: value,
            },
          },
        });
      } else {
        setOrderDetails({
          ...orderDetails,
          [parent]: {
            ...orderDetails[parent],
            [child]: value,
          },
        });
      }
    } else {
      setOrderDetails({
        ...orderDetails,
        [name]: value,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Form submitted", { orderType, orderDetails, cartItems });

    // Basic validation
    if (orderType === "pickup") {
      if (!orderDetails.pickupDetails.date || !orderDetails.pickupDetails.time || !orderDetails.pickupDetails.location) {
        alert("Please fill in all pickup details (date, time, and location)");
        return;
      }
    } else {
      if (!orderDetails.deliveryDetails.address.street || !orderDetails.deliveryDetails.address.city ||
        !orderDetails.deliveryDetails.address.state || !orderDetails.deliveryDetails.date || !orderDetails.deliveryDetails.time) {
        alert("Please fill in all delivery details (address, date, and time)");
        return;
      }
    }

    // Convert cart items to the format expected by the backend
    const items = cartItems.map(item => ({
      product: item.productId,
      quantity: item.quantity,
      price: item.price
    }));

    // Prepare order details with proper date formatting
    let orderDetailsToSend = {};

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
    } const orderData = {
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
                  ? "Please select pickup date and time. Pickup will be at the farmer's location."
                  : "Please provide delivery address, date, and time details."
                }
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="text-gray-700 font-medium mb-2 block">
                  Order Type *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="orderType"
                      value="pickup"
                      checked={orderType === "pickup"}
                      onChange={() => setOrderType("pickup")}
                      className="mr-2"
                    />
                    Pickup
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="orderType"
                      value="delivery"
                      checked={orderType === "delivery"}
                      onChange={() => setOrderType("delivery")}
                      className="mr-2"
                    />
                    Delivery
                  </label>
                </div>
              </div>

              {orderType === "pickup" ? (
                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-gray-700 font-medium mb-2"
                      htmlFor="pickupDate"
                    >
                      Pickup Date
                    </label>
                    <input
                      type="date"
                      id="pickupDate"
                      name="pickupDetails.date"
                      value={orderDetails.pickupDetails.date}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label
                      className="block text-gray-700 font-medium mb-2"
                      htmlFor="pickupTime"
                    >
                      Pickup Time
                    </label>
                    <input
                      type="time"
                      id="pickupTime"
                      name="pickupDetails.time"
                      value={orderDetails.pickupDetails.time}
                      onChange={(e) => {
                        console.log("Pickup time input changed:", e.target.value);
                        setOrderDetails({
                          ...orderDetails,
                          pickupDetails: {
                            ...orderDetails.pickupDetails,
                            time: e.target.value
                          }
                        });
                      }}
                      className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                      required
                    />
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
                  <div>
                    <label
                      className="block text-gray-700 font-medium mb-2"
                      htmlFor="street"
                    >
                      Street Address
                    </label>
                    <input
                      type="text"
                      id="street"
                      name="deliveryDetails.address.street"
                      value={orderDetails.deliveryDetails.address.street}
                      onChange={handleInputChange}
                      placeholder="Enter your street address"
                      className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-gray-700 font-medium mb-2"
                        htmlFor="city"
                      >
                        City
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="deliveryDetails.address.city"
                        value={orderDetails.deliveryDetails.address.city}
                        onChange={handleInputChange}
                        placeholder="Enter city"
                        className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label
                        className="block text-gray-700 font-medium mb-2"
                        htmlFor="state"
                      >
                        State
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="deliveryDetails.address.state"
                        value={orderDetails.deliveryDetails.address.state}
                        onChange={handleInputChange}
                        placeholder="Enter state"
                        className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-gray-700 font-medium mb-2"
                      htmlFor="zipCode"
                    >
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      name="deliveryDetails.address.zipCode"
                      value={orderDetails.deliveryDetails.address.zipCode}
                      onChange={handleInputChange}
                      placeholder="Enter ZIP code"
                      className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                      required
                    />
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
                      value={orderDetails.deliveryDetails.time} onChange={(e) => {
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
                </div>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-xl text-lg transition-colors"
                >
                  {loading ? "Placing Order..." : "Place Order"}
                </button>
                {cartItems.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    Total: ₹{calculateTotal().toFixed(2)}
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
