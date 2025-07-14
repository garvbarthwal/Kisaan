const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Please add a product name"],
      trim: true,
    },
    description: {
      type: String,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    price: {
      type: Number,
      required: [true, "Please add a price"],
    },
    unit: {
      type: String,
      required: [true, "Please add a unit (e.g., lb, kg, bunch)"],
    },
    quantityAvailable: {
      type: Number,
      required: [true, "Please add available quantity"],
    },
    images: [String],
    isOrganic: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    harvestDate: Date,
    availableUntil: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    fulfillmentOptions: {
      delivery: {
        type: Boolean,
        default: false,
      },
      pickup: {
        type: Boolean,
        default: false,
      },
    },
    pickupHours: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", ProductSchema);
