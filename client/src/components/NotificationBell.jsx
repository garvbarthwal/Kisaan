import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaBell } from "react-icons/fa";
import { getUserNotifications, markAsRead, markAllAsRead } from "../redux/slices/notificationSlice";

const NotificationBell = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount, loading } = useSelector((state) => state.notifications);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Only fetch notifications if user is authenticated
    if (isAuthenticated && user) {
      dispatch(getUserNotifications());
    }
  }, [dispatch, isAuthenticated, user]);

  // Don't render the component if user is not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-2 text-gray-600 hover:text-green-600 transition-colors"
        onClick={() => setShowDropdown(!showDropdown)}
        title="View notifications"
      >
        <FaBell className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-green-600 hover:text-green-800"
              >
                Mark all as read
              </button>
            )}
          </div>

          {loading && (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No notifications yet
            </div>
          )}

          {!loading &&
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`block p-3 border-b transition-colors ${!notification.isRead ? "bg-blue-50" : ""
                  } cursor-default`}
                onClick={() => {
                  if (!notification.isRead) {
                    dispatch(markAsRead(notification._id));
                  }
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 