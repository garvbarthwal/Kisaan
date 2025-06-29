const mongoose = require("mongoose");

const FarmerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    farmName: {
      type: String,
      required: [true, "Please add a farm name"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
    },
    farmImages: [String],
    farmingPractices: [String],
    establishedYear: Number,
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String,
    },
    businessHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },
    acceptsPickup: {
      type: Boolean,
      default: false,
    },
    acceptsDelivery: {
      type: Boolean,
      default: false,
    },
    deliveryRadius: {
      type: Number,
      default: 0,
    },
    farmLocation: {
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
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FarmerProfile", FarmerProfileSchema);
