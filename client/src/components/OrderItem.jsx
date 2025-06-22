import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { cancelOrder } from "../redux/slices/orderSlice";
import { FaEye, FaMapMarkerAlt, FaCalendarAlt, FaTimes } from "react-icons/fa";

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

  // Function to get status badge color
  const getStatusBadgeClass = (status) => {
    // Special case for accepted orders with unfinalized delivery dates
    if (status === "accepted" && order.deliveryDetails && !order.deliveryDetails.isDateFinalized) {
      return "badge-blue"; // Use the same color as pending
    }

    switch (status) {
      case "pending":
        return "badge-blue";
      case "accepted":
        return "badge-green";
      case "rejected":
        return "badge-red";
      case "completed":
        return "badge-green";
      case "cancelled":
        return "badge-red";
      default:
        return "badge-blue";
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
        console.error("Invalid date:", dateString);
        return "Invalid date";
      }
      
      const options = { year: "numeric", month: "short", day: "numeric" };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error("Error formatting date:", error);
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
        details: order.pickupDetails
      };
    } else if (order.deliveryDetails) {
      return {
        type: "Delivery",
        details: order.deliveryDetails
      };
    }
    return { type: "Unknown", details: null };
  };

  const orderType = getOrderType();

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

  return (
    <div className="card p-4 mb-4">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-gray-500 text-sm">Order ID:</span>
                <span className="font-medium">{order._id.substring(0, 8)}...</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 text-sm">Date:</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mt-2 md:mt-0">
              <span className="text-gray-500 text-sm">Status:</span>
              <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                {getDisplayStatus()}
              </span>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-gray-500 text-sm">Customer:</span>
              <span className="font-medium">{order.consumer.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 text-sm">Order Type:</span>
              <span className="font-medium">{orderType.type}</span>
            </div>
          </div>

          {orderType.details && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <FaMapMarkerAlt className="text-green-600" />
                <span className="text-sm font-medium">{orderType.type} Details:</span>
              </div>
              {orderType.type === "Pickup" && (
                <div className="text-sm text-gray-600">
                  <div>Date: {orderType.details.date ? formatDate(orderType.details.date) : "Not specified"}</div>
                  <div>Time: {orderType.details.time || "Not specified"}</div>
                  <div>Location: {orderType.details.location || "Not specified"}</div>
                </div>
              )}
              {orderType.type === "Delivery" && (
                <div className="text-sm text-gray-600">
                  <div>Requested Date: {orderType.details.requestedDate ? formatDate(orderType.details.requestedDate) : "Not specified"}</div>
                  <div>Requested Time: {orderType.details.requestedTime || "Not specified"}</div>
                  {orderType.details.isDateFinalized && (
                    <>
                      <div className="font-medium text-green-600 mt-1">Finalized Date: {orderType.details.finalizedDate ? formatDate(orderType.details.finalizedDate) : "Not set"}</div>
                      <div className="font-medium text-green-600">Finalized Time: {orderType.details.finalizedTime || "Not set"}</div>
                    </>
                  )}
                  <div>Address: {orderType.details.address?.street}, {orderType.details.address?.city}, {orderType.details.address?.state}</div>
                </div>
              )}
            </div>
          )}

          <div className="mb-3">
            <div className="text-sm font-medium mb-2">Order Items:</div>
            <div className="space-y-1">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.product.name} x {item.quantity}</span>
                  <span className="font-medium">₨{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {order.notes && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">Customer Notes:</span> {order.notes}
              </p>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Payment: {order.paymentMethod?.charAt(0).toUpperCase() + order.paymentMethod?.slice(1) || "Not specified"}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-lg font-bold text-green-600">
                Total: ₨{order.totalAmount.toFixed(2)}
              </div>
              {canCancelOrder() && (
                <button
                  onClick={handleCancelOrder}
                  title={order.status === "pending" 
                    ? "Pending orders can be cancelled anytime" 
                    : "Accepted orders can be cancelled within 2 hours of placement"}
                  className="bg-red-100 hover:bg-red-200 text-red-600 text-xs px-2 py-1 rounded transition-colors"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>

          {/* Cancel order info text */}
          {canCancelOrder() && (
            <p className="text-xs text-gray-500 mt-2 text-right">
              {order.status === "pending" 
                ? "Pending orders can be cancelled anytime" 
                : "Accepted orders can be cancelled within 2 hours of placement"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderItem;
