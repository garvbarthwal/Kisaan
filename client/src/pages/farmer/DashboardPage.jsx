import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getFarmerProducts } from "../../redux/slices/productSlice";
import { getFarmerOrders } from "../../redux/slices/orderSlice";
import { getConversations } from "../../redux/slices/messageSlice";
import Loader from "../../components/Loader";
import {
  FaBox,
  FaShoppingCart,
  FaComment,
  FaPlus,
  FaChartLine,
  FaRobot,
  FaBell,
  FaClipboardList,
  FaShippingFast,
} from "react-icons/fa";
import { updateOrderStatus } from "../../redux/slices/orderSlice";

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { farmerProducts, loading: productsLoading } = useSelector(
    (state) => state.products
  );
  const { farmerOrders, loading: ordersLoading } = useSelector(
    (state) => state.orders
  );
  const { conversations, loading: messagesLoading } = useSelector(
    (state) => state.messages
  );
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    console.log("Dispatching farmer data requests");
    dispatch(getFarmerProducts());
    dispatch(getFarmerOrders());
    dispatch(getConversations());
  }, [dispatch]);

  useEffect(() => {
    console.log("Farmer orders data:", farmerOrders);
  }, [farmerOrders]);

  const orderCounts = {
    pending: ordersLoading
      ? 0
      : farmerOrders.filter(
          (order) => 
            order.status === "pending" || 
            (order.status === "accepted" && 
             order.deliveryDetails && 
             !order.deliveryDetails.isDateFinalized)
        ).length,
    accepted: ordersLoading
      ? 0
      : farmerOrders.filter(
          (order) => 
            order.status === "accepted" && 
            (!order.deliveryDetails || order.deliveryDetails.isDateFinalized)
        ).length,
    completed: ordersLoading
      ? 0
      : farmerOrders.filter((order) => order.status === "completed").length,
    rejected: ordersLoading
      ? 0
      : farmerOrders.filter((order) => order.status === "rejected").length,
    cancelled: ordersLoading
      ? 0
      : farmerOrders.filter((order) => order.status === "cancelled").length,
  };

  const unreadMessages = messagesLoading
    ? 0
    : conversations.reduce(
      (total, conversation) => total + conversation.unreadCount,
      0
    );

  const totalRevenue = ordersLoading
    ? 0
    : farmerOrders
      .filter((order) => order.status === "completed")
      .reduce((total, order) => total + order.totalAmount, 0);

  if (productsLoading || ordersLoading || messagesLoading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Farmer Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}!</p>
        </div>
        <Link
          to="/farmer/products/add"
          className="mt-4 md:mt-0 btn btn-primary flex items-center space-x-2"
        >
          <FaPlus />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        <div className="glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Products</h3>
            <FaBox className="text-green-500 text-xl" />
          </div>
          <p className="text-3xl font-bold">{farmerProducts.length}</p>
          <Link
            to="/farmer/products"
            className="text-green-500 hover:text-green-700 text-sm mt-2 inline-block"
          >
            Manage Products
          </Link>
        </div>

        <div className="glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Pending Orders</h3>
            <FaClipboardList className="text-orange-500 text-xl" />
          </div>
          <p className="text-3xl font-bold">{orderCounts.pending}</p>
          <div className="flex gap-2 mt-3">
            <Link
              to="/farmer/orders"
              className="text-green-500 hover:text-green-700 text-sm inline-block"
            >
              View All Orders
            </Link>
            {orderCounts.pending > 0 && (
              <Link
                to="/farmer/orders"
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1 rounded-full"
              >
                Review Now
              </Link>
            )}
          </div>
        </div>

        <div className="glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Unread Messages</h3>
            <div className="bg-blue-500 text-white px-3 py-1 rounded-md font-bold">
              Orders
            </div>
          </div>
          <p className="text-3xl font-bold">{unreadMessages}</p>
          <Link
            to="/messages"
            className="text-green-500 hover:text-green-700 text-sm mt-2 inline-block"
          >
            View Messages
          </Link>
        </div>

        <div className="glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Total Revenue</h3>
            <FaChartLine className="text-green-500 text-xl" />
          </div>
          <p className="text-3xl font-bold">₨{totalRevenue.toFixed(2)}</p>
          <span className="text-gray-500 text-sm mt-2 inline-block">
            From completed orders
          </span>
        </div>

        <div className="glass p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-700">AI Assistant</h3>
            <FaRobot className="text-blue-500 text-xl" />
          </div>
          <p className="text-sm text-blue-600 mb-3">
            Get farming advice in your language
          </p>
          <Link
            to="/farmer/ai-assistant"
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg transition-colors inline-flex items-center space-x-2"
          >
            <FaRobot />
            <span>Ask AI</span>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="glass p-6 rounded-xl mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
          <Link
            to="/farmer/orders"
            className="text-green-500 hover:text-green-700"
          >
            View All
          </Link>
        </div>

        {farmerOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3">Order ID</th>
                  <th className="text-left py-3">Customer</th>
                  <th className="text-center py-3">Date</th>
                  <th className="text-center py-3">Status</th>
                  <th className="text-right py-3">Total</th>
                  <th className="text-right py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {farmerOrders.slice(0, 5).map((order) => (
                  <tr key={order._id} className="border-b border-gray-200">
                    <td className="py-3">
                      <Link
                        to={`/orders/${order._id}`}
                        className="text-green-500 hover:text-green-700"
                      >
                        #{order._id.substring(0, 8)}
                      </Link>
                    </td>
                    <td className="py-3">{order.consumer.name}</td>
                    <td className="text-center py-3">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-center py-3">
                      <span
                        className={`badge ${
                          order.status === "pending" || 
                          (order.status === "accepted" && order.deliveryDetails && !order.deliveryDetails.isDateFinalized)
                            ? "badge-blue"
                            : order.status === "accepted" || order.status === "completed"
                              ? "badge-green"
                              : "badge-red"
                        }`}
                      >
                        {order.status === "accepted" && order.deliveryDetails && !order.deliveryDetails.isDateFinalized
                          ? "Awaiting Delivery Details"
                          : order.status.charAt(0).toUpperCase() + order.status.slice(1)
                        }
                      </span>
                    </td>
                    <td className="text-right py-3">
                      ₨{order.totalAmount.toFixed(2)}
                    </td>
                    <td className="text-right py-3">
                      {order.status === "pending" && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => dispatch(updateOrderStatus({ id: order._id, status: "accepted" }))}
                            className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => dispatch(updateOrderStatus({ id: order._id, status: "rejected" }))}
                            className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {order.status === "accepted" && (
                        <div className="flex gap-1">
                          {order.deliveryDetails && !order.deliveryDetails.isDateFinalized ? (
                            <Link
                              to="/farmer/orders"
                              className="text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600"
                            >
                              Finalize Delivery
                            </Link>
                          ) : (
                            <button
                              onClick={() => dispatch(updateOrderStatus({ id: order._id, status: "completed" }))}
                              className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No orders yet</p>
          </div>
        )}
      </div>

      {/* Product Stats */}
      <div className="glass p-6 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Product Statistics</h2>
          <Link
            to="/farmer/products"
            className="text-green-500 hover:text-green-700"
          >
            Manage Inventory
          </Link>
        </div>

        {farmerProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3">Product</th>
                  <th className="text-center py-3">Category</th>
                  <th className="text-center py-3">Price</th>
                  <th className="text-center py-3">Stock</th>
                  <th className="text-right py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {farmerProducts.slice(0, 5).map((product) => (
                  <tr key={product._id} className="border-b border-gray-200">
                    <td className="py-3">
                      <Link
                        to={`/products/${product._id}`}
                        className="text-green-500 hover:text-green-700"
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="text-center py-3">
                      {product.category ? product.category.name : "-"}
                    </td>
                    <td className="text-center py-3">
                      ₨{product.price.toFixed(2)}
                    </td>
                    <td className="text-center py-3">{product.quantityAvailable}</td>
                    <td className="text-right py-3">
                      <Link
                        to={`/farmer/products/edit/${product._id}`}
                        className="text-blue-500 hover:text-blue-700 mr-3"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No products yet</p>
            <Link
              to="/farmer/products/add"
              className="btn btn-sm btn-outline mt-4"
            >
              Add Your First Product
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
