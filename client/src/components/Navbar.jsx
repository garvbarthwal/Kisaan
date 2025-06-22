import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import { resetOrderState } from "../redux/slices/orderSlice";
import { toast } from "react-toastify";
import {
  FaLeaf,
  FaShoppingCart,
  FaBars,
  FaTimes,
  FaUser,
  FaSignOutAlt,
  FaBell,
} from "react-icons/fa";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart);
  const { farmerOrders } = useSelector((state) => state.orders);

  // Calculate pending orders for farmers
  const pendingOrdersCount = user?.role === "farmer" 
    ? farmerOrders.filter(order => order.status === "pending").length 
    : 0;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const handleCartClick = () => {
    if (cartItems.length > 0) {
      // Reset order state before navigating to checkout
      dispatch(resetOrderState());
      navigate("/checkout");
    } else {
      toast.info("Your cart is empty");
    }
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <FaLeaf className="text-green-500 text-2xl" />
            <span className="text-xl font-bold text-green-600">Kisaan</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="text-gray-700 hover:text-green-500 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/products"
              className="text-gray-700 hover:text-green-500 transition-colors"
            >
              Products
            </Link>
            <Link
              to="/farmers"
              className="text-gray-700 hover:text-green-500 transition-colors"
            >
              Farmers
            </Link>
            <Link
              to="/about"
              className="text-gray-700 hover:text-green-500 transition-colors"
            >
              About
            </Link>

            {isAuthenticated && user?.role === "consumer" && (
              <>
                <button 
                  onClick={handleCartClick}
                  className="relative p-2 text-gray-700 hover:text-green-500 transition-colors"
                  aria-label="Shopping Cart"
                >
                  <FaShoppingCart className="text-xl" />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItems.length}
                    </span>
                  )}
                </button>
                <NotificationBell />
              </>
            )}

            {isAuthenticated && user?.role === "farmer" && (
              <>
                <Link to="/farmer/orders" className="relative flex items-center">
                  <span className="text-gray-700 hover:text-green-500 transition-colors font-medium">Orders</span>
                  {pendingOrdersCount > 0 && (
                    <span className="ml-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingOrdersCount}
                    </span>
                  )}
                </Link>
                <NotificationBell />
              </>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={toggleProfile}
                  className="flex items-center space-x-2 text-gray-700 hover:text-green-500 transition-colors focus:outline-none"
                >
                  <FaUser className="text-xl" />
                  <span className="font-medium">
                    {user?.name?.split(" ")[0]}
                  </span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    {user?.role === "admin" && (
                      <Link
                        to="/admin/dashboard"
                        className="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-500"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}

                    {user?.role === "farmer" && (
                      <>
                        <Link
                          to="/farmer/dashboard"
                          className="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-500"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Farmer Dashboard
                        </Link>
                        <Link
                          to="/farmer/ai-assistant"
                          className="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-500"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          AI Assistant
                        </Link>
                      </>
                    )}

                    {user?.role !== "admin" && (
                      <>
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-500"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Profile
                        </Link>

                        {user?.role === "consumer" && (
                          <Link
                            to="/orders"
                            className="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-500"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            Orders
                          </Link>
                        )}
                      </>
                    )}

                    <Link
                      to="/messages"
                      className="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-500"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Messages
                    </Link>

                    <button
                      onClick={() => {
                        handleLogout();
                        setIsProfileOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-500"
                    >
                      <div className="flex items-center space-x-2">
                        <FaSignOutAlt />
                        <span>Logout</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-green-500 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-green-500 focus:outline-none"
            >
              {isMenuOpen ? (
                <FaTimes className="text-2xl" />
              ) : (
                <FaBars className="text-2xl" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-green-500 transition-colors"
                onClick={toggleMenu}
              >
                Home
              </Link>
              <Link
                to="/products"
                className="text-gray-700 hover:text-green-500 transition-colors"
                onClick={toggleMenu}
              >
                Products
              </Link>
              <Link
                to="/farmers"
                className="text-gray-700 hover:text-green-500 transition-colors"
                onClick={toggleMenu}
              >
                Farmers
              </Link>
              <Link
                to="/about"
                className="text-gray-700 hover:text-green-500 transition-colors"
                onClick={toggleMenu}
              >
                About
              </Link>

              {isAuthenticated && user?.role === "consumer" && (
                <button
                  onClick={() => {
                    if (cartItems.length > 0) {
                      dispatch(resetOrderState());
                      navigate("/checkout");
                    } else {
                      toast.info("Your cart is empty");
                    }
                    toggleMenu();
                  }}
                  className="flex items-center space-x-2 text-gray-700 hover:text-green-500 transition-colors text-left"
                >
                  <FaShoppingCart />
                  <span>Cart ({cartItems.length})</span>
                </button>
              )}
              
              {isAuthenticated && user?.role === "farmer" && (
                <Link
                  to="/farmer/orders"
                  className="flex items-center space-x-2 text-gray-700 hover:text-green-500 transition-colors"
                  onClick={toggleMenu}
                >
                  <span>Orders</span>
                  {pendingOrdersCount > 0 && (
                    <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingOrdersCount}
                    </span>
                  )}
                </Link>
              )}
              
              {isAuthenticated ? (
                <>
                  {user?.role === "admin" && (
                    <Link
                      to="/admin/dashboard"
                      className="text-gray-700 hover:text-green-500 transition-colors"
                      onClick={toggleMenu}
                    >
                      Admin Dashboard
                    </Link>
                  )}

                  {user?.role === "farmer" && (
                    <>
                      <Link
                        to="/farmer/dashboard"
                        className="text-gray-700 hover:text-green-500 transition-colors"
                        onClick={toggleMenu}
                      >
                        Farmer Dashboard
                      </Link>
                      <Link
                        to="/farmer/ai-assistant"
                        className="text-gray-700 hover:text-green-500 transition-colors"
                        onClick={toggleMenu}
                      >
                        AI Assistant
                      </Link>
                    </>
                  )}

                  <Link
                    to="/profile"
                    className="text-gray-700 hover:text-green-500 transition-colors"
                    onClick={toggleMenu}
                  >
                    Profile
                  </Link>

                  {user?.role === "consumer" && (
                    <Link
                      to="/orders"
                      className="text-gray-700 hover:text-green-500 transition-colors"
                      onClick={toggleMenu}
                    >
                      Orders
                    </Link>
                  )}

                  <Link
                    to="/messages"
                    className="text-gray-700 hover:text-green-500 transition-colors"
                    onClick={toggleMenu}
                  >
                    Messages
                  </Link>

                  <button
                    onClick={() => {
                      handleLogout();
                      toggleMenu();
                    }}
                    className="flex items-center space-x-2 text-gray-700 hover:text-green-500 transition-colors text-left"
                  >
                    <FaSignOutAlt />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-green-500 transition-colors"
                    onClick={toggleMenu}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-center"
                    onClick={toggleMenu}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
