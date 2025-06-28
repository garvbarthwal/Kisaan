// OrdersPage.jsx
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
    dispatch(getFarmerOrders());
  }, [dispatch]);

  const orders = Array.isArray(farmerOrders) ? farmerOrders : [];

  const filteredOrders =
    filter === "all"
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

  const handleQuickAction = (order, status) => {
    if (isValidObjectId(order._id)) {
      dispatch(updateOrderStatus({ id: order._id, status }));
    }
  };

  const handleUpdateStatus = () => {
    if (selectedOrder && newStatus) {
      dispatch(updateOrderStatus({ id: selectedOrder._id, status: newStatus }));
      setShowStatusModal(false);
      setSelectedOrder(null);
      setNewStatus("");
    }
  };

  const handleDeliveryFinalization = () => {
    if (selectedOrder && deliveryDate && deliveryTime) {
      dispatch(
        finalizeDeliveryDate({
          id: selectedOrder._id,
          finalizedDate: deliveryDate,
          finalizedTime: deliveryTime,
        })
      );
      setShowDeliveryModal(false);
      setSelectedOrder(null);
      setDeliveryDate("");
      setDeliveryTime("");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";

    try {
      if (typeof dateString === "string" && dateString.endsWith("Z")) {
        const datePart = dateString.split("T")[0];
        const [year, month, day] = datePart.split("-").map(Number);
        return `${day} ${getMonthName(month)} ${year}`;
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return "Error formatting date";
    }
  };

  const getMonthName = (monthNum) => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return months[monthNum - 1];
  };

  if (loading) return <Loader />;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Manage Orders</h1>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "pending", "accepted", "completed", "rejected", "cancelled"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${filter === status
                ? status === "rejected" || status === "cancelled"
                  ? "bg-red-500 text-white"
                  : "bg-green-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order._id} className="glass p-4 rounded-xl">
              <OrderItem order={order} />
              <div className="mt-4 border-t pt-4 flex flex-col sm:flex-row sm:justify-between gap-3 text-sm">
                <span className="text-gray-600">
                  Placed on {formatDate(order.createdAt)}
                </span>

                <div className="flex flex-wrap gap-2">
                  {order.consumer?.["_id"] ? (
                    <Link
                      to={`/messages/${order.consumer._id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg flex items-center gap-1"
                    >
                      <FaComment />
                      Message
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="bg-gray-400 text-white px-3 py-1 rounded-lg flex items-center gap-1 cursor-not-allowed"
                    >
                      <FaComment />
                      No Contact
                    </button>
                  )}

                  {order.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleQuickAction(order, "accepted")}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
                      >
                        <FaCheck className="inline mr-1" /> Accept
                      </button>
                      <button
                        onClick={() => handleQuickAction(order, "rejected")}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
                      >
                        <FaTimes className="inline mr-1" /> Reject
                      </button>
                    </>
                  )}

                  {order.status === "accepted" && (
                    <>
                      <button
                        onClick={() => handleQuickAction(order, "completed")}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
                      >
                        <FaCheck className="inline mr-1" /> Complete
                      </button>
                      {order.deliveryDetails && !order.deliveryDetails.isDateFinalized && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDeliveryModal(true);
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg"
                        >
                          <FaCalendarAlt className="inline mr-1" /> Finalize
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setNewStatus(order.status);
                      setShowStatusModal(true);
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg"
                  >
                    <FaEye className="inline mr-1" /> More
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

      {/* Status Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-11/12 max-w-md">
            <h3 className="text-lg sm:text-xl font-bold mb-4">Update Order Status</h3>
            <p className="text-sm mb-4 break-words">
              Order #{selectedOrder._id.slice(0, 8)}{" "}
              {selectedOrder.consumer && `for ${selectedOrder.consumer.name}`}
            </p>
            <div className="mb-4">
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                Status
              </label>
              <select
                id="status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="border px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Modal */}
      {showDeliveryModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-11/12 max-w-md">
            <h3 className="text-lg sm:text-xl font-bold mb-4">Finalize Delivery Date</h3>
            <p className="text-sm mb-4 break-words">
              Order #{selectedOrder._id.slice(0, 8)}{" "}
              {selectedOrder.consumer && `for ${selectedOrder.consumer.name}`}
            </p>

            <div className="mb-3 text-sm">
              <label className="font-medium">Requested Date</label>
              <p className="bg-gray-50 rounded px-2 py-1 mt-1">
                {selectedOrder.deliveryDetails?.requestedDate
                  ? formatDate(selectedOrder.deliveryDetails?.requestedDate)
                  : "Not specified"}
              </p>
            </div>

            <div className="mb-4 text-sm">
              <label className="font-medium">Requested Time</label>
              <p className="bg-gray-50 rounded px-2 py-1 mt-1">
                {selectedOrder.deliveryDetails?.requestedTime || "Not specified"}
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="finalizedDate" className="block text-sm font-medium mb-1">
                Finalized Date *
              </label>
              <input
                type="date"
                id="finalizedDate"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="finalizedTime" className="block text-sm font-medium mb-1">
                Finalized Time *
              </label>
              <input
                type="time"
                id="finalizedTime"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="border px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeliveryFinalization}
                disabled={!deliveryDate || !deliveryTime}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
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
