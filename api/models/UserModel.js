const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["consumer", "farmer", "admin"],
      default: "consumer",
    },
    phone: {
      type: String,
      required: [true, "Please provide a phone number"],
    },
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
    savedAddresses: [{
      name: {
        type: String,
        default: "Delivery Address"
      },
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
      isDefault: {
        type: Boolean,
        default: false,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      }
    }],
    preferredLanguage: {
      type: String,
      enum: ["en", "hi", "bn", "te", "mr", "ta", "gu", "kn", "ml", "pa", "or", "as", "ur"],
      default: "en",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
