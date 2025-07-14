const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
});

const OrderSchema = new mongoose.Schema(
  {
    consumer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [OrderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
      default: "pending",
    },
    pickupDetails: {
      date: Date,
      time: String,
      location: String,
    },
    deliveryDetails: {
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        coordinates: {
          lat: {
            type: Number,
            validate: {
              validator: function (v) {
                return v >= -90 && v <= 90;
              },
              message: 'Latitude must be between -90 and 90 degrees'
            }
          },
          lng: {
            type: Number,
            validate: {
              validator: function (v) {
                return v >= -180 && v <= 180;
              },
              message: 'Longitude must be between -180 and 180 degrees'
            }
          }
        },
        locationDetected: {
          type: Boolean,
          default: false,
        },
      },
      requestedDate: Date,
      requestedTime: String,
      finalizedDate: Date,
      finalizedTime: String,
      isDateFinalized: {
        type: Boolean,
        default: false,
      },
    },
    paymentMethod: {
      type: String,
      enum: ["cash"],
      default: "cash",
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", OrderSchema);
