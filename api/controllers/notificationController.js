const Notification = require("../models/NotificationModel");

// @desc    Create a new notification
// @route   POST /api/notifications
// @access  Private (Admin/Farmer)
exports.createNotification = async (req, res) => {
  try {
    const { user, title, message, type, relatedOrder } = req.body;

    const notification = await Notification.create({
      user,
      title,
      message,
      type,
      relatedOrder,
    });

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort("-createdAt")
      .populate("relatedOrder", "status");

    res.json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this notification",
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Create notification helper function (for internal use)
// @access  Private
exports.createNotificationHelper = async (userData) => {
  try {
    await Notification.create(userData);
    return true;
  } catch (error) {
    console.error("Error creating notification:", error);
    return false;
  }
}; 