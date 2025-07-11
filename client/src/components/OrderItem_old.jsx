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
    if (order.pickupDetails) {
      return {
        type: "Pickup",
        details: order.pickupDetails,
        icon: FaMapMarkerAlt,
        color: "text-green-600"
      };
    } else if (order.deliveryDetails) {
      return {
        type: "Delivery",
        details: order.deliveryDetails,
        icon: FaTruck,
        color: "text-blue-600"
      };
    }
    return { type: "Unknown", details: null, icon: FaExclamationTriangle, color: "text-gray-600" };
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

    // Pending orders can always be cancelled
    return true;
  };

  const handleCancelOrder = () => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      dispatch(cancelOrder(order._id));
    }
  };

  // If order data is incomplete or missing, show a message
  if (!order || !order._id) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
        <div className="flex items-center space-x-2">
          <FaExclamationTriangle className="text-red-600" />
          <div className="text-red-600 font-medium">Error: Invalid order data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Order Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <FaLeaf className="text-green-600 text-xl" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Order #{order._id.substring(0, 8)}
                </h3>
                <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                  <statusConfig.icon className="w-3 h-3" />
                  <span>{getDisplayStatus()}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <FaCalendarAlt className="w-3 h-3" />
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <orderType.icon className={`w-3 h-3 ${orderType.color}`} />
                  <span>{orderType.type}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                ₹{(order.totalAmount || 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">
                {order.paymentMethod ? order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1) : "Not specified"}
              </div>
            </div>
            {canCancelOrder() && (
              <button
                onClick={handleCancelOrder}
                title={order.status === "pending"
                  ? "Pending orders can be cancelled anytime"
                  : "Accepted orders can be cancelled within 2 hours of placement"}
                className="flex items-center space-x-1 bg-red-100 hover:bg-red-200 text-red-600 text-sm px-3 py-2 rounded-lg transition-colors font-medium"
              >
                <FaTimes className="w-3 h-3" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Order Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Order Items and Farmer */}
          <div className="space-y-4">
            {/* Farmer Info */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FaUser className="text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {order.farmer?.name || 'Unknown Farmer'}
                </div>
                <div className="text-xs text-gray-500">Farmer</div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items</h4>
              <div className="space-y-2">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <FaLeaf className="text-green-600 text-sm" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.product?.name || 'Unknown product'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Qty: {item.quantity || 0} × ₹{(item.price || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-lg">
                    No items in this order
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Fulfillment Details */}
          <div className="space-y-4">
            {/* Fulfillment Details */}
            {orderType.details && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
                  <orderType.icon className={`w-4 h-4 ${orderType.color}`} />
                  <span>{orderType.type} Details</span>
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {orderType.type === "Pickup" && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{orderType.details.date ? formatDate(orderType.details.date) : "Not specified"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">{orderType.details.time || "Not specified"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">{orderType.details.location || "Farmer's location"}</span>
                      </div>
                    </>
                  )}
                  {orderType.type === "Delivery" && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Requested Date:</span>
                        <span className="font-medium">{orderType.details.requestedDate ? formatDate(orderType.details.requestedDate) : "Not specified"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Requested Time:</span>
                        <span className="font-medium">{orderType.details.requestedTime || "Not specified"}</span>
                      </div>
                      {orderType.details.isDateFinalized && (
                        <>
                          <div className="border-t border-gray-200 pt-3 mt-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Confirmed Date:</span>
                              <span className="font-medium text-green-600">{orderType.details.finalizedDate ? formatDate(orderType.details.finalizedDate) : "Not set"}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Confirmed Time:</span>
                              <span className="font-medium text-green-600">{orderType.details.finalizedTime || "Not set"}</span>
                            </div>
                          </div>
                        </>
                      )}
                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <div className="text-sm">
                          <span className="text-gray-600">Address:</span>
                          <div className="font-medium mt-1">
                            {orderType.details.address ? 
                              `${orderType.details.address.street}, ${orderType.details.address.city}, ${orderType.details.address.state}` 
                              : "Address not provided"
                            }
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {order.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">{order.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {canCancelOrder() && (
              <span>
                {order.status === "pending"
                  ? "Pending orders can be cancelled anytime"
                  : "Accepted orders can be cancelled within 2 hours of placement"}
              </span>
            )}
          </div>
          <Link
            to={`/orders/${order._id}`}
            className="inline-flex items-center space-x-2 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
          >
            <FaEye className="w-4 h-4" />
            <span>View Details</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderItem;
