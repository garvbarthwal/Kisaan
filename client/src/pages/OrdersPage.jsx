import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getConsumerOrders } from "../redux/slices/orderSlice";
import OrderItem from "../components/OrderItem";
import Loader from "../components/Loader";
import {
  FaShoppingBasket,
  FaFilter,
  FaSearch,
  FaSort,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaChartBar,
  FaListAlt
} from "react-icons/fa";

const OrdersPage = () => {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.orders);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    dispatch(getConsumerOrders());
  }, [dispatch]);

  // Filter and search orders
  const filteredOrders = orders.filter(order => {
    // Filter by status
    const statusMatch = filter === "all" ? true :
      filter === "pending" ? (
        order.status === "pending" ||
        (order.status === "accepted" &&
          order.deliveryDetails &&
          !order.deliveryDetails.isDateFinalized)
      ) :
        filter === "accepted" ? (
          order.status === "accepted" &&
          (!order.deliveryDetails || order.deliveryDetails.isDateFinalized)
        ) :
          order.status === filter;

    // Search by order ID, farmer name, or product names
    const searchMatch = !searchTerm ||
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.farmer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items?.some(item =>
        item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return statusMatch && searchMatch;
  }).sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "amount-high":
        return (b.totalAmount || 0) - (a.totalAmount || 0);
      case "amount-low":
        return (a.totalAmount || 0) - (b.totalAmount || 0);
      case "status":
        return a.status.localeCompare(b.status);
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  // Get order counts for each status
  const getOrderCounts = () => {
    return {
      all: orders.length,
      pending: orders.filter(order =>
        order.status === "pending" ||
        (order.status === "accepted" &&
          order.deliveryDetails &&
          !order.deliveryDetails.isDateFinalized)
      ).length,
      accepted: orders.filter(order =>
        order.status === "accepted" &&
        (!order.deliveryDetails || order.deliveryDetails.isDateFinalized)
      ).length,
      completed: orders.filter(order => order.status === "completed").length,
      rejected: orders.filter(order => order.status === "rejected").length,
      cancelled: orders.filter(order => order.status === "cancelled").length,
    };
  };

  const orderCounts = getOrderCounts();

  // Calculate total spent
  const totalSpent = orders
    .filter(order => order.status === "completed")
    .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-800">My Orders</h1>
            <p className="text-gray-600">
              Track and manage your orders from local farmers
            </p>
          </div>
          {orders.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm">
              <div className="flex items-center space-x-2 text-gray-600">
                <FaCalendarAlt className="text-green-600" />
                <span>Total Orders: <span className="font-semibold text-gray-800">{orders.length}</span></span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <FaChartBar className="text-green-600" />
                <span>Total Spent: <span className="font-semibold text-green-600">₹{totalSpent.toFixed(2)}</span></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search, Filter, and Sort Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <div className="flex flex-col space-y-6">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by order ID, farmer, or product..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Orders', color: 'gray' },
                { key: 'pending', label: 'Pending', color: 'yellow' },
                { key: 'accepted', label: 'Accepted', color: 'green' },
                { key: 'completed', label: 'Completed', color: 'blue' },
                { key: 'rejected', label: 'Rejected', color: 'red' },
                { key: 'cancelled', label: 'Cancelled', color: 'gray' },
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${filter === filterOption.key
                      ? filterOption.color === 'gray'
                        ? 'bg-gray-600 text-white'
                        : filterOption.color === 'yellow'
                          ? 'bg-yellow-500 text-white'
                          : filterOption.color === 'green'
                            ? 'bg-green-500 text-white'
                            : filterOption.color === 'blue'
                              ? 'bg-blue-500 text-white'
                              : 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                >
                  <span>{filterOption.label}</span>
                  {orderCounts[filterOption.key] > 0 && (
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${filter === filterOption.key
                        ? 'bg-white bg-opacity-30'
                        : 'bg-gray-200 text-gray-600'
                      }`}>
                      {orderCounts[filterOption.key]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2">
              <FaSort className="text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount-high">Amount: High to Low</option>
                <option value="amount-low">Amount: Low to High</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Summary Cards (only show if there are orders) */}
      {orders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {[
            { key: 'pending', label: 'Pending', icon: FaClock, color: 'yellow' },
            { key: 'accepted', label: 'Accepted', icon: FaCheckCircle, color: 'green' },
            { key: 'completed', label: 'Completed', icon: FaCheckCircle, color: 'blue' },
            { key: 'rejected', label: 'Rejected', icon: FaTimesCircle, color: 'red' },
            { key: 'cancelled', label: 'Cancelled', icon: FaTimesCircle, color: 'gray' },
          ].map((status) => {
            const IconComponent = status.icon;
            return (
              <div key={status.key} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{status.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{orderCounts[status.key]}</p>
                  </div>
                  <IconComponent className={`text-2xl ${status.color === 'yellow' ? 'text-yellow-500' :
                      status.color === 'green' ? 'text-green-500' :
                        status.color === 'blue' ? 'text-blue-500' :
                          status.color === 'red' ? 'text-red-500' :
                            'text-gray-500'
                    }`} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Orders List or Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <FaShoppingBasket className="text-gray-400 text-2xl" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || filter !== "all" ? "No matching orders found" : "No orders yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Start shopping from local farmers to see your orders here"}
              </p>
              {!searchTerm && filter === "all" && (
                <button
                  onClick={() => window.location.href = '/products'}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Browse Products
                </button>
              )}
              {(searchTerm || filter !== "all") && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setSearchTerm("")}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Clear Search
                  </button>
                  <button
                    onClick={() => setFilter("all")}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Show All Orders
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Results count */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredOrders.length} of {orders.length} orders
              {searchTerm && ` for "${searchTerm}"`}
              {filter !== "all" && ` with status "${filter}"`}
            </span>
            <span className="flex items-center space-x-1">
              <FaListAlt className="text-gray-400" />
              <span>Sorted by {sortBy.replace('-', ' ')}</span>
            </span>
          </div>

          {/* Orders Grid */}
          <div className="grid gap-6">
            {filteredOrders.map((order) => (
              <OrderItem key={order._id} order={order} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
