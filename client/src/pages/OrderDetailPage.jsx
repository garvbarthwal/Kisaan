import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getOrderDetails, cancelOrder } from "../redux/slices/orderSlice";
import { sendMessage } from "../redux/slices/messageSlice";
import Loader from "../components/Loader";
import {
  FaArrowLeft,
  FaLeaf,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaComment,
  FaTimes,
} from "react-icons/fa";

const OrderDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const [showMessageForm, setShowMessageForm] = useState(false);
  const [message, setMessage] = useState("");

  const { order, loading } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);
  useEffect(() => {
    dispatch(getOrderDetails(id));
  }, [dispatch, id]);

  // Function to check if order can be cancelled
  const canCancelOrder = () => {
    if (user.role !== "consumer") return false;
    if (!order || (order.status !== "accepted" && order.status !== "pending")) return false;

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
      dispatch(cancelOrder(id));
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!message.trim()) {
      return;
    }

    const receiverId =
      user.role === "consumer" ? order.farmer._id : order.consumer._id;

    dispatch(
      sendMessage({
        receiver: receiverId,
        content: message,
        relatedOrder: id,
      })
    );

    setMessage("");
    setShowMessageForm(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    console.log("Formatting date:", dateString);

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
      const options = { year: "numeric", month: "long", day: "numeric" };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      return "Error formatting date";
    }
  };

  // Helper function to get month name
  const getMonthName = (monthNum) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[monthNum - 1]; // monthNum is 1-indexed
  };

  const getStatusBadgeClass = (status) => {
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

  if (loading || !order) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Link
        to={`/${user.role == 'farmer' && 'farmer/'}orders`}
        className="inline-flex items-center text-green-600 hover:text-green-700 mb-8 transition-colors duration-200"
      >
        <FaArrowLeft className="mr-2" />
        Back to Orders
      </Link>

      <div className="bg-white shadow-lg rounded-2xl mb-8 overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-3 text-gray-800">
                Order #{order._id.substring(0, 8)}
              </h1>
              <p className="text-gray-500">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-3">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadgeClass(
                  order.status
                )}`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>

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
            <div className="mb-6 text-right">
              <p className="text-xs text-red-500">
                {order.status === "pending"
                  ? "Pending orders can be cancelled anytime"
                  : "Accepted orders can be cancelled within 2 hours of placement"}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Order Details
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-lg text-gray-800">
                    ₨{order.totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="capitalize font-medium text-gray-800">
                    {order.paymentMethod.replace("_", " ")}
                  </span>
                </div>
                {order.notes && (
                  <div className="mt-4">
                    <span className="text-gray-600 block mb-2">Notes:</span>
                    <p className="text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                      {order.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                {order.pickupDetails && order.pickupDetails.location
                  ? "Pickup Details"
                  : "Delivery Details"}
              </h2>
              {order.pickupDetails && order.pickupDetails.location ? (
                <div className="space-y-4">
                  <div className="flex items-start bg-white p-3 rounded-lg border border-gray-200">
                    <FaMapMarkerAlt className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">
                      {order.pickupDetails.location}
                    </span>
                  </div>
                  <div className="flex items-start bg-white p-3 rounded-lg border border-gray-200">
                    <FaCalendarAlt className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">
                      {order.pickupDetails.date ?
                        formatDate(order.pickupDetails.date) :
                        "Date not specified"}
                    </span>
                  </div>
                  <div className="flex items-start bg-white p-3 rounded-lg border border-gray-200">
                    <FaClock className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">
                      {order.pickupDetails.time || "Time not specified"}
                    </span>
                  </div>
                </div>
              ) : order.deliveryDetails && order.deliveryDetails.address ? (
                <div className="space-y-4">
                  <div className="flex items-start bg-white p-3 rounded-lg border border-gray-200">
                    <FaMapMarkerAlt className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-700">
                        {order.deliveryDetails.address.street}
                      </p>
                      <p className="text-gray-700">
                        {order.deliveryDetails.address.city},{" "}
                        {order.deliveryDetails.address.state}{" "}
                        {order.deliveryDetails.address.zipCode}
                      </p>
                    </div>
                  </div>

                  {/* Requested Date/Time */}
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">Your Requested Date & Time</h4>
                    <div className="flex items-start bg-white p-2 rounded border border-blue-100 mb-2">
                      <FaCalendarAlt className="text-blue-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-blue-700">
                        {order.deliveryDetails.requestedDate ?
                          formatDate(order.deliveryDetails.requestedDate) :
                          "Date not specified"}
                      </span>
                    </div>
                    <div className="flex items-start bg-white p-2 rounded border border-blue-100">
                      <FaClock className="text-blue-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-blue-700">
                        {order.deliveryDetails.requestedTime || "Time not specified"}
                      </span>
                    </div>
                  </div>

                  {/* Finalized Date/Time */}
                  {order.deliveryDetails.isDateFinalized && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-800 mb-2">Finalized Delivery Date & Time</h4>
                      {order.deliveryDetails.finalizedDate && (
                        <div className="flex items-start bg-white p-2 rounded border border-green-100 mb-2">
                          <FaCalendarAlt className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-green-700 font-medium">
                            {formatDate(order.deliveryDetails.finalizedDate)}
                          </span>
                        </div>
                      )}
                      {order.deliveryDetails.finalizedTime && (
                        <div className="flex items-start bg-white p-2 rounded border border-green-100">
                          <FaClock className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-green-700 font-medium">
                            {order.deliveryDetails.finalizedTime}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  No delivery/pickup details provided
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Customer Information
              </h2>
              <div className="space-y-2">
                <p className="font-medium text-gray-800">
                  {order.consumer.name}
                </p>
                <p className="text-gray-600">{order.consumer.email}</p>
                {order.consumer.phone && (
                  <p className="text-gray-600">{order.consumer.phone}</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Farmer Information
              </h2>
              <div className="space-y-2">
                <p className="font-medium text-gray-800">{order.farmer.name}</p>
                <p className="text-gray-600">{order.farmer.email}</p>
                {order.farmer.phone && (
                  <p className="text-gray-600">{order.farmer.phone}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-2xl mb-8 overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            Order Items
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 text-gray-600 font-semibold">
                    Product
                  </th>
                  <th className="text-center py-4 px-4 text-gray-600 font-semibold">
                    Price
                  </th>
                  <th className="text-center py-4 px-4 text-gray-600 font-semibold">
                    Quantity
                  </th>
                  <th className="text-right py-4 px-4 text-gray-600 font-semibold">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden mr-4">
                          {item.product.images &&
                            item.product.images.length > 0 ? (
                            <img
                              src={item.product.images[0] || "/placeholder.svg"}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FaLeaf className="text-green-500 text-2xl" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {item.product.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-4 px-4 text-gray-700">
                      ₨{item.price.toFixed(2)}
                    </td>
                    <td className="text-center py-4 px-4 text-gray-700">
                      {item.quantity}
                    </td>
                    <td className="text-right py-4 px-4 font-medium text-gray-800">
                      ₨{(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    colSpan="3"
                    className="text-right py-4 px-4 font-bold text-gray-800"
                  >
                    Total:
                  </td>
                  <td className="text-right py-4 px-4 font-bold text-gray-800">
                    ₨{order.totalAmount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            Contact {user.role === "consumer" ? "Farmer" : "Customer"}
          </h2>
          {showMessageForm ? (
            <form onSubmit={handleSendMessage} className="space-y-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                placeholder={`Write your message to the ${user.role === "consumer" ? "farmer" : "customer"
                  }...`}
                rows="4"
                required
              ></textarea>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  Send Message
                </button>
                <button
                  type="button"
                  onClick={() => setShowMessageForm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowMessageForm(true)}
              className="flex items-center space-x-3 text-green-600 hover:text-green-700 transition-colors duration-200"
            >
              <FaComment className="text-xl" />
              <span className="font-medium">
                Send a message about this order to the{" "}
                {user.role === "consumer" ? "farmer" : "customer"}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
