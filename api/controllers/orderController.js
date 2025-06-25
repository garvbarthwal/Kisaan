const Order = require("../models/OrderModel");
const Product = require("../models/ProductModel");
const { createNotificationHelper } = require("./notificationController");

// @desc    Create an order
// @route   POST /api/orders
// @access  Private (Consumer only)
exports.createOrder = async (req, res) => {
  try {
    const { farmer, items, pickupDetails, deliveryDetails, notes } = req.body;

    // Fix for delivery date issue
    let processedDeliveryDetails = null;
    if (deliveryDetails) {
      // Keep the date as is without timezone conversion
      processedDeliveryDetails = {
        ...deliveryDetails,
        requestedDate: deliveryDetails.requestedDate
      };
    }    // Process pickup details if provided
    let processedPickupDetails = null;
    if (pickupDetails) {
      // Keep the date as is without timezone conversion
      processedPickupDetails = {
        ...pickupDetails,
        date: pickupDetails.date
      };
    }

    let totalAmount = 0;
    const productsToValidate = [];

    // Validate all products and calculate total
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.product} not found`,
        });
      }

      if (product.quantityAvailable < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough quantity available for ${product.name}. Available: ${product.quantityAvailable}, Requested: ${item.quantity}`,
        });
      }

      totalAmount += product.price * item.quantity;
      item.price = product.price;

      // Store product info for final validation
      productsToValidate.push({
        productId: product._id,
        name: product.name,
        currentStock: product.quantityAvailable,
        orderedQuantity: item.quantity
      });
    }

    // Final validation - check if stock is still available (in case it changed during processing)
    for (const productInfo of productsToValidate) {
      const currentProduct = await Product.findById(productInfo.productId);
      if (currentProduct.quantityAvailable < productInfo.orderedQuantity) {
        return res.status(400).json({
          success: false,
          message: `Stock for ${productInfo.name} has changed. Available: ${currentProduct.quantityAvailable}, Requested: ${productInfo.orderedQuantity}`,
        });
      }
    }    // Create the order (stock will be reduced when farmer accepts)
    const order = await Order.create({
      consumer: req.user._id,
      farmer,
      items,
      totalAmount,
      pickupDetails: processedPickupDetails,
      deliveryDetails: processedDeliveryDetails,
      notes,
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Get consumer orders
// @route   GET /api/orders/consumer
// @access  Private (Consumer only)
exports.getConsumerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ consumer: req.user._id })
      .populate("farmer", "name")
      .populate({
        path: "items.product",
        select: "name images",
      })
      .sort("-createdAt");

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Get farmer orders
// @route   GET /api/orders/farmer
// @access  Private (Farmer only)
exports.getFarmerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ farmer: req.user._id })
      .populate("consumer", "name")
      .populate({
        path: "items.product",
        select: "name images",
      })
      .sort("-createdAt");

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("consumer", "name email phone")
      .populate("farmer", "name email phone")
      .populate({
        path: "items.product",
        select: "name images",
      });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (
      order.consumer._id.toString() !== req.user._id.toString() &&
      order.farmer._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to view this order" });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res
      .status(500)
    .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Private (Farmer or Admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (
      order.farmer.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this order",
      });
    }

    const previousStatus = order.status;
    order.status = status;

    // Handle stock management based on status change
    if (previousStatus === "pending") {
      if (status === "accepted") {
        // Reduce stock when order is accepted
        for (const item of order.items) {
          const product = await Product.findById(item.product);
          if (product) {
            if (product.quantityAvailable < item.quantity) {
              return res.status(400).json({
                success: false,
                message: `Not enough quantity available for ${product.name}. Current stock: ${product.quantityAvailable}, Ordered: ${item.quantity}`,
              });
            }
            product.quantityAvailable -= item.quantity;
            await product.save();
          }
        }
      } else if (status === "rejected" || status === "cancelled") {
        // Stock remains unchanged when order is rejected/cancelled
        // (since it was never reduced in the first place)
      }
    } else if (previousStatus === "accepted") {
      if (status === "rejected" || status === "cancelled") {
        // Restore stock when accepted order is rejected/cancelled
        for (const item of order.items) {
          const product = await Product.findById(item.product);
          if (product) {
            product.quantityAvailable += item.quantity;
            await product.save();
          }
        }
      }
    }

    await order.save();

    // Send notification to consumer about order status change
    if (status === "accepted") {
      await createNotificationHelper({
        user: order.consumer,
        title: "Order Accepted",
        message: "Your order has been accepted by the farmer.",
        type: "order_accepted",
        relatedOrder: order._id,
      });
    } else if (status === "rejected") {
      await createNotificationHelper({
        user: order.consumer,
        title: "Order Rejected",
        message: "Your order has been rejected by the farmer.",
        type: "order_rejected",
        relatedOrder: order._id,
      });
    } else if (status === "completed") {
      await createNotificationHelper({
        user: order.consumer,
        title: "Order Completed",
        message: "Your order has been marked as completed.",
        type: "order_completed",
        relatedOrder: order._id,
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Get all orders (admin only)
// @route   GET /api/orders
// @access  Private (Admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("consumer", "name")
      .populate("farmer", "name")
      .sort("-createdAt"); res.json({
        success: true,
        count: orders.length,
        data: orders,
      });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Finalize delivery date (farmer only)
// @route   PUT /api/orders/:id/finalize-delivery
// @access  Private (Farmer only)
exports.finalizeDeliveryDate = async (req, res) => {
  try {
    const { finalizedDate, finalizedTime } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this order",
      });
    }

    if (!order.deliveryDetails) {
      return res.status(400).json({
        success: false,
        message: "This order is not a delivery order",
      });
    }    // Update delivery details
    order.deliveryDetails.finalizedDate = finalizedDate;
    order.deliveryDetails.finalizedTime = finalizedTime;
    order.deliveryDetails.isDateFinalized = true;

    await order.save();

    // Send notification to consumer about finalized delivery date
    await createNotificationHelper({
      user: order.consumer,
      title: "Delivery Date Finalized",
      message: `Your delivery has been scheduled for ${finalizedDate} at ${finalizedTime}.`,
      type: "delivery_finalized",
      relatedOrder: order._id,
    }); res.json({
      success: true,
      data: order,
      message: "Delivery date finalized successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Cancel order (consumer only)
// @route   PUT /api/orders/:id/cancel
// @access  Private (Consumer only)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.consumer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this order",
      });
    }

    // Check if order is already cancelled, rejected, or completed
    if (["cancelled", "rejected", "completed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled as it is ${order.status}.`,
      });
    }

    // For accepted orders, check if 2 hours have passed since order creation
    if (order.status === "accepted") {
      const orderTime = new Date(order.createdAt);
      const currentTime = new Date();
      const timeDifference = currentTime - orderTime;
      const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

      if (timeDifference > twoHoursInMs) {
        return res.status(400).json({
          success: false,
          message: "Accepted orders can only be cancelled within 2 hours of placement",
        });
      }
    }

    // Update order status to cancelled
    order.status = "cancelled";
    await order.save();

    // If order was accepted, restore the stock
    if (order.status === "accepted") {
      for (const item of order.items) {
        const product = item.product;
        if (product) {
          product.quantityAvailable += item.quantity;
          await product.save();
        }
      }
    }

    // Send notification to farmer about cancelled order
    await createNotificationHelper({
      user: order.farmer,
      title: "Order Cancelled",
      message: "An order has been cancelled by the customer.",
      type: "order_cancelled",
      relatedOrder: order._id,
    });

    res.json({
      success: true,
      data: order,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
