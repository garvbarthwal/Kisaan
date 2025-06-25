import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getFarmerOrders,
  updateOrderStatus,
  finalizeDeliveryDate,
} from "../../redux/slices/orderSlice";
import OrderItem from "../../components/OrderItem";
import Loader from "../../components/Loader";
import {
  FaShoppingBasket,
  FaCheck,
  FaTimes,
  FaEye,
  FaCalendarAlt,
  FaComment,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { isValidObjectId } from "../../utils/objectId";

const OrdersPage = () => {
  const dispatch = useDispatch();
  const { farmerOrders, loading } = useSelector((state) => state.orders);
  const [filter, setFilter] = useState("all");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");

  useEffect(() => {
    console.log("Dispatching getFarmerOrders in OrdersPage");
    dispatch(getFarmerOrders());

    // Set up polling interval for real-time order updates
    const orderPollInterval = setInterval(() => {
      dispatch(getFarmerOrders());
    }, 20000); // Poll every 20 seconds

    // Clean up on unmount
    return () => clearInterval(orderPollInterval);
  }, [dispatch]);

  useEffect(() => {
    console.log("Farmer orders in OrdersPage:", farmerOrders);
  }, [farmerOrders]);
  // Safety check - ensure farmerOrders is always an array
  const orders = Array.isArray(farmerOrders) ? farmerOrders : [];

  const filteredOrders = filter === "all"
    ? orders
    : filter === "pending"
      ? orders.filter(
        (order) =>
          order?.status === "pending" ||
          (order?.status === "accepted" &&
            order?.deliveryDetails &&
            !order?.deliveryDetails?.isDateFinalized)
      )
      : filter === "accepted"
        ? orders.filter(
          (order) =>
            order?.status === "accepted" &&
            (!order?.deliveryDetails || order?.deliveryDetails?.isDateFinalized)
        )
        : orders.filter((order) => order?.status === filter);

  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setShowStatusModal(true);
  };

  const handleQuickAction = (order, status) => {
    if (isValidObjectId(order._id)) {
      dispatch(updateOrderStatus({ id: order._id, status }));
    }
  };

  const handleStatusUpdate = () => {
    if (selectedOrder && newStatus) {
      dispatch(updateOrderStatus({ id: selectedOrder._id, status: newStatus }));
      setShowStatusModal(false);
      setSelectedOrder(null);
      setNewStatus("");
    }
  };

  const handleDeliveryFinalization = () => {
    if (selectedOrder && deliveryDate && deliveryTime) {
      dispatch(finalizeDeliveryDate({
        id: selectedOrder._id,
        finalizedDate: deliveryDate,
        finalizedTime: deliveryTime
      }));
      setShowDeliveryModal(false);
      setSelectedOrder(null);
      setDeliveryDate("");
      setDeliveryTime("");
    }
  };

  const openDeliveryModal = (order) => {
    setSelectedOrder(order);
    setShowDeliveryModal(true);
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

      // For other date formats      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return "Invalid date";
      } const options = { year: "numeric", month: "short", day: "numeric" };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
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

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Manage Orders</h1>

      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg ${filter === "all"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } transition-colors`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-lg ${filter === "pending"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } transition-colors`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("accepted")}
            className={`px-4 py-2 rounded-lg ${filter === "accepted"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } transition-colors`}
          >
            Accepted
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-4 py-2 rounded-lg ${filter === "completed"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } transition-colors`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter("rejected")}
            className={`px-4 py-2 rounded-lg ${filter === "rejected"
              ? "bg-red-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } transition-colors`}
          >
            Rejected
          </button>
          <button
            onClick={() => setFilter("cancelled")}
            className={`px-4 py-2 rounded-lg ${filter === "cancelled"
              ? "bg-red-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } transition-colors`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order._id} className="glass p-4 rounded-xl">
              <OrderItem order={order} />              <div className="mt-4 border-t border-gray-200 pt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Order placed on {formatDate(order.createdAt)}
                </div>
                <div className="flex gap-2">
                  {order.consumer && order.consumer._id ? (
                    <Link
                      to={`/messages/${order.consumer._id}`}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
                    >
                      <FaComment />
                      Messages
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="px-3 py-1 bg-gray-400 text-white rounded-lg text-sm flex items-center gap-1 cursor-not-allowed"
                    >
                      <FaComment />
                      No contact info
                    </button>
                  )}
                  {order.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleQuickAction(order, "accepted")}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        <FaCheck className="inline mr-1" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleQuickAction(order, "rejected")}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        <FaTimes className="inline mr-1" />
                        Reject
                      </button>
                    </div>
                  )}

                  {order.status === "accepted" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleQuickAction(order, "completed")}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        <FaCheck className="inline mr-1" />
                        Mark Complete
                      </button>
                      {order.deliveryDetails && !order.deliveryDetails.isDateFinalized && (
                        <button
                          onClick={() => openDeliveryModal(order)}
                          className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                        >
                          <FaCalendarAlt className="inline mr-1" />
                          Finalize Delivery
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => handleUpdateStatus(order)}
                    className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                  >
                    <FaEye className="inline mr-1" />
                    More Options
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 glass rounded-xl">
          <FaShoppingBasket className="text-green-500 text-5xl mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Orders Found</h3>
          <p className="text-gray-600">
            {filter === "all"
              ? "You don't have any orders yet."
              : `You don't have any ${filter} orders.`}
          </p>
        </div>
      )}

      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">            <h3 className="text-xl font-bold mb-4">Update Order Status</h3>
            <p className="mb-4">
              Order #{selectedOrder._id.substring(0, 8)}
              {selectedOrder.consumer ? ` for ${selectedOrder.consumer.name}` : ''}
            </p>
            <div className="mb-4">
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <select
                id="status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="form-input"
              >
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">            <h3 className="text-xl font-bold mb-4">Finalize Delivery Date</h3>
            <p className="mb-4">
              Order #{selectedOrder._id.substring(0, 8)}
              {selectedOrder.consumer ? ` for ${selectedOrder.consumer.name}` : ''}
            </p>

            <div className="mb-4">              <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer's Requested Date
              </label>
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {selectedOrder.deliveryDetails?.requestedDate
                  ? formatDate(selectedOrder.deliveryDetails.requestedDate)
                  : "Not specified"}
              </p>
            </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer's Requested Time
                </label>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {selectedOrder.deliveryDetails?.requestedTime || "Not specified"}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="finalizedDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Finalized Date *
              </label>
              <input
                type="date"
                id="finalizedDate"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="finalizedTime"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Finalized Time *
              </label>
              <input
                type="time"
                id="finalizedTime"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeliveryFinalization}
                disabled={!deliveryDate || !deliveryTime}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Finalize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
