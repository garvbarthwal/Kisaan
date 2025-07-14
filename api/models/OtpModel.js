const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
    mobile: {
        type: String,
        required: true,
        match: [/^[6-9]\d{9}$/, 'Please provide a valid Indian mobile number']
    },
    otp: {
        type: String,
        required: false // Not required when using Twilio Verify service
    },
    aadharLast4: {
        type: String,
        required: true,
        match: [/^\d{4}$/, 'Please provide exactly 4 digits']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    governmentData: {
        name: String,
        mobile: String,
        pmKisanId: String
    },
    verified: {
        type: Boolean,
        default: false
    },
    attempts: {
        type: Number,
        default: 0,
        max: 3
    },
    twilioVerify: {
        type: Boolean,
        default: false // true if using Twilio Verify service, false if using manual OTP
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
    }
}, {
    timestamps: true
});

// Index for faster queries and automatic cleanup
otpSchema.index({ mobile: 1, userId: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to generate OTP
otpSchema.statics.generateOTP = function () {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Method to verify OTP
otpSchema.methods.verifyOTP = function (inputOTP) {
    if (this.attempts >= 3) {
        throw new Error('Maximum OTP attempts exceeded. Please request a new OTP.');
    }

    this.attempts += 1;

    if (this.otp === inputOTP && !this.verified) {
        this.verified = true;
        return true;
    }

    return false;
};

module.exports = mongoose.model("OTP", otpSchema);
