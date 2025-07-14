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
      monday: { open: String, close: String, closed: { type: Boolean, default: false } },
      tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
      wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
      thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
      friday: { open: String, close: String, closed: { type: Boolean, default: false } },
      saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
      sunday: { open: String, close: String, closed: { type: Boolean, default: false } },
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
    verificationDetails: {
      method: {
        type: String,
        enum: ['government_data', 'manual_review', 'admin_verified'],
        default: null
      },
      verifiedAt: {
        type: Date,
        default: null
      },
      verifiedBy: {
        type: String, // Could be 'system' or admin ID
        default: null
      },
      governmentData: {
        name: String,
        mobile: String,
        pmKisanId: String
      }
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FarmerProfile", FarmerProfileSchema);
