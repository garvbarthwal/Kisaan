const mongoose = require("mongoose");

// Mock Government Data Schema for Farmer Verification
const mockGovernmentDataSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
        match: [/^[6-9]\d{9}$/, 'Please provide a valid Indian mobile number']
    },
    aadhar: {
        type: String,
        required: true,
        unique: true,
        match: [/^\d{4}-\d{4}-\d{4}$/, 'Please provide a valid Aadhar number format (XXXX-XXXX-XXXX)']
    },
    pmKisanId: {
        type: String,
        required: true,
        unique: true,
        match: [/^PMKISAN[A-Z]{2}\d{3}$/, 'Please provide a valid PM-KISAN ID format']
    },
    verificationCount: {
        type: Number,
        default: 0
    },
    lastVerificationAttempt: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
mockGovernmentDataSchema.index({ mobile: 1, aadhar: 1 });

// Method to get last 4 digits of Aadhar
mockGovernmentDataSchema.methods.getAadharLast4 = function () {
    return this.aadhar.slice(-4);
};

// Method to verify farmer by mobile and last 4 digits of Aadhar
mockGovernmentDataSchema.statics.verifyFarmer = async function (mobile, aadharLast4) {
    try {
        const farmer = await this.findOne({
            mobile: mobile,
            aadhar: { $regex: `${aadharLast4}$` },
            isActive: true
        });

        if (farmer) {
            // Update verification attempt count
            farmer.verificationCount += 1;
            farmer.lastVerificationAttempt = new Date();
            await farmer.save();

            return {
                success: true,
                farmer: {
                    name: farmer.name,
                    mobile: farmer.mobile,
                    pmKisanId: farmer.pmKisanId
                }
            };
        } else {
            return {
                success: false,
                message: 'No matching farmer record found in government database'
            };
        }
    } catch (error) {
        throw new Error(`Verification failed: ${error.message}`);
    }
};

// Method to get verification statistics
mockGovernmentDataSchema.statics.getVerificationStats = async function () {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                totalFarmers: { $sum: 1 },
                verifiedFarmers: {
                    $sum: {
                        $cond: [{ $gt: ["$verificationCount", 0] }, 1, 0]
                    }
                },
                totalVerificationAttempts: { $sum: "$verificationCount" },
                avgVerificationAttempts: { $avg: "$verificationCount" }
            }
        }
    ]);

    return stats[0] || {
        totalFarmers: 0,
        verifiedFarmers: 0,
        totalVerificationAttempts: 0,
        avgVerificationAttempts: 0
    };
};

const MockGovernmentData = mongoose.model("MockGovernmentData", mockGovernmentDataSchema);

module.exports = MockGovernmentData;
