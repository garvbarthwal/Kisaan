import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { cancelOrder } from "../redux/slices/orderSlice";
import {
  FaEye,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaTimes,
  FaClock,
  FaTruck,
  FaLeaf,
  FaUser,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaBoxOpen,
  FaInfoCircle,
  FaPhone,
  FaEnvelope
} from "react-icons/fa";

const OrderItem = ({ order }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Function to get display status
  const getDisplayStatus = () => {
    if (order.status === "accepted" && order.deliveryDetails && !order.deliveryDetails.isDateFinalized) {
      return "Awaiting Delivery Details";
    }
    return order.status.charAt(0).toUpperCase() + order.status.slice(1);
  };

  // Function to get status badge configuration
  const getStatusBadgeConfig = (status) => {
    // Special case for accepted orders with unfinalized delivery dates
    if (status === "accepted" && order.deliveryDetails && !order.deliveryDetails.isDateFinalized) {
      return {
        bg: "bg-blue-100",
        text: "text-blue-800",
        border: "border-blue-200",
        icon: FaClock,
        pulse: true
      };
    }

    switch (status) {
      case "pending":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          border: "border-yellow-200",
          icon: FaClock,
          pulse: true
        };
      case "accepted":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          border: "border-green-200",
          icon: FaCheckCircle,
          pulse: false
        };
      case "rejected":
        return {
          bg: "bg-red-100",
          text: "text-red-800",
          border: "border-red-200",
          icon: FaTimesCircle,
          pulse: false
        };
      case "completed":
        return {
          bg: "bg-emerald-100",
          text: "text-emerald-800",
          border: "border-emerald-200",
          icon: FaCheckCircle,
          pulse: false
        };
      case "cancelled":
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          border: "border-gray-200",
          icon: FaTimesCircle,
          pulse: false
        };
      default:
        return {
          bg: "bg-blue-100",
          text: "text-blue-800",
          border: "border-blue-200",
          icon: FaClock,
          pulse: false
        };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";

    try {
      // For ISO date strings that end with Z (UTC/Zulu time)
      if (typeof dateString === 'string' && dateString.endsWith('Z')) {
        // Extract just the date part from the ISO string
        const datePart = dateString.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);

        // Create a date using local timezone (no UTC conversion)
        return `${day} ${getMonthName(month)} ${year}`;
      }

      // For other date formats
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      const options = { year: "numeric", month: "short", day: "numeric" };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return "Error formatting date";
    }
  };

  // Helper function to get month name
  const getMonthName = (monthNum) => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return months[monthNum - 1]; // monthNum is 1-indexed
  };

  // Get order type and details
  const getOrderType = () => {
    if (order.pickupDetails && order.pickupDetails.date) {
      return {
        type: "Pickup",
        details: order.pickupDetails,
        icon: FaMapMarkerAlt,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200"
      };
    } else if (order.deliveryDetails && (order.deliveryDetails.finalizedDate || order.deliveryDetails.requestedDate)) {
      return {
        type: "Delivery",
        details: order.deliveryDetails,
        icon: FaTruck,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200"
      };
    }
    return {
      type: "Processing",
      details: null,
      icon: FaExclamationTriangle,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200"
    };
  };

  const orderType = getOrderType();
  const statusConfig = getStatusBadgeConfig(order.status);

  // Function to check if order can be cancelled
  const canCancelOrder = () => {
    if (user.role !== "consumer") return false;
    if (order.status !== "accepted" && order.status !== "pending") return false;

    // For accepted orders, check if within 2 hours
    if (order.status === "accepted") {
      const orderTime = new Date(order.createdAt);
      const currentTime = new Date();
      const timeDifference = currentTime - orderTime;
      const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

      return timeDifference <= twoHoursInMs;
    }

    return true; // Pending orders can always be cancelled
  };

  const handleCancelOrder = () => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      dispatch(cancelOrder(order._id));
    }
  };

  // Get the total quantity of items
  const getTotalQuantity = () => {
    return order.items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Order Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 px-6 py-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
                <FaBoxOpen className="text-green-600 text-xl" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Order #{order._id.slice(-6).toUpperCase()}
              </h3>
              <p className="text-sm text-gray-600">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} ${statusConfig.pulse ? 'animate-pulse' : ''
            }`}>
            <statusConfig.icon className="w-4 h-4 mr-2" />
            {getDisplayStatus()}
          </div>
        </div>
      </div>

      {/* Order Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Order Items & Farmer Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Farmer Information */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FaUser className="text-green-600 text-lg" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{order.farmer?.name || "Unknown Farmer"}</h4>
                <p className="text-sm text-gray-600">
                  {order.farmer?.address?.city && order.farmer?.address?.state
                    ? `${order.farmer.address.city}, ${order.farmer.address.state}`
                    : "Location not specified"}
                </p>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                  <FaPhone className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <FaEnvelope className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Order Items</h4>
                <span className="text-sm text-gray-600">
                  {getTotalQuantity()} {getTotalQuantity() === 1 ? 'item' : 'items'}
                </span>
              </div>
              <div className="space-y-3">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center overflow-hidden">
                      {item.product?.images && item.product.images.length > 0 ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full bg-green-100 flex items-center justify-center" style={{ display: item.product?.images?.length ? 'none' : 'flex' }}>
                        <FaLeaf className="text-green-600 text-lg" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{item.product?.name || "Unknown Product"}</h5>
                      <p className="text-sm text-gray-600">
                        {item.quantity} × ₹{item.price?.toFixed(2) || '0.00'} = ₹{((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                      </p>
                    </div>
                    {item.product?.isOrganic && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FaLeaf className="w-3 h-3 mr-1" />
                          Organic
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Actions */}
          <div className="space-y-6">
            {/* Fulfillment Details */}
            <div className={`p-4 rounded-lg border ${orderType.bgColor} ${orderType.borderColor}`}>
              <div className="flex items-center space-x-3 mb-3">
                <orderType.icon className={`text-lg ${orderType.color}`} />
                <h4 className="font-semibold text-gray-900">{orderType.type}</h4>
              </div>

              {orderType.type === "Pickup" && orderType.details && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <FaCalendarAlt className="text-gray-500" />
                    <span>Date: {formatDate(orderType.details.date)}</span>
                  </div>
                  {orderType.details.time && (
                    <div className="flex items-center space-x-2">
                      <FaClock className="text-gray-500" />
                      <span>Time: {orderType.details.time}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <FaMapMarkerAlt className="text-gray-500" />
                    <span>Location: {orderType.details.location || "Farmer's Location"}</span>
                  </div>
                </div>
              )}

              {orderType.type === "Delivery" && orderType.details && (
                <div className="space-y-2 text-sm">
                  {orderType.details.finalizedDate ? (
                    <>
                      <div className="flex items-center space-x-2">
                        <FaCalendarAlt className="text-gray-500" />
                        <span>Date: {formatDate(orderType.details.finalizedDate)}</span>
                      </div>
                      {orderType.details.finalizedTime && (
                        <div className="flex items-center space-x-2">
                          <FaClock className="text-gray-500" />
                          <span>Time: {orderType.details.finalizedTime}</span>
                        </div>
                      )}
                    </>
                  ) : orderType.details.requestedDate ? (
                    <>
                      <div className="flex items-center space-x-2">
                        <FaCalendarAlt className="text-gray-500" />
                        <span>Requested: {formatDate(orderType.details.requestedDate)}</span>
                      </div>
                      {orderType.details.requestedTime && (
                        <div className="flex items-center space-x-2">
                          <FaClock className="text-gray-500" />
                          <span>Time: {orderType.details.requestedTime}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 text-yellow-600">
                        <FaInfoCircle className="text-sm" />
                        <span className="text-xs">Awaiting farmer confirmation</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <FaInfoCircle className="text-sm" />
                      <span className="text-xs">Delivery details pending</span>
                    </div>
                  )}

                  {orderType.details.address && (
                    <div className="mt-3 p-2 bg-white rounded border border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-1">Delivery Address:</p>
                      <p className="text-xs text-gray-600">
                        {[
                          orderType.details.address.street,
                          orderType.details.address.city,
                          orderType.details.address.state,
                          orderType.details.address.zipCode
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Order Total */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total Amount</span>
                <span className="text-xl font-bold text-green-600">
                  ₹{order.totalAmount?.toFixed(2) || '0.00'}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Payment Method: Cash</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                to={`/orders/${order._id}`}
                className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <FaEye className="w-4 h-4 mr-2" />
                View Details
              </Link>

              {canCancelOrder() && (
                <button
                  onClick={handleCancelOrder}
                  className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <FaTimes className="w-4 h-4 mr-2" />
                  Cancel Order
                </button>
              )}
            </div>

            {/* Additional Notes */}
            {order.notes && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">Order Notes</h5>
                <p className="text-sm text-gray-700">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderItem;
