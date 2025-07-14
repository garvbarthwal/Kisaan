const MockGovernmentData = require("../models/MockGovernmentDataModel");
const FarmerProfile = require("../models/FarmerProfileModel");
const User = require("../models/UserModel");
const OTP = require("../models/OtpModel");
const twilioService = require("../utils/twilioService");

// @desc    Step 1: Verify farmer data and send OTP
// @route   POST /api/verification/verify-farmer
// @access  Private (Farmer only)
exports.verifyFarmer = async (req, res) => {
    try {
        const { mobile, aadharLast4 } = req.body;

        // Validate input
        if (!mobile || !aadharLast4) {
            return res.status(400).json({
                success: false,
                message: "Please provide mobile number and last 4 digits of Aadhar"
            });
        }

        // Validate mobile number format
        if (!/^[6-9]\d{9}$/.test(mobile)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid Indian mobile number"
            });
        }

        // Validate aadhar last 4 digits
        if (!/^\d{4}$/.test(aadharLast4)) {
            return res.status(400).json({
                success: false,
                message: "Please provide exactly 4 digits of Aadhar number"
            });
        }

        // Check if farmer is already verified
        const existingProfile = await FarmerProfile.findOne({ user: req.user._id });
        if (existingProfile && existingProfile.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Farmer is already verified"
            });
        }

        // Verify farmer against government data
        const verificationResult = await MockGovernmentData.verifyFarmer(mobile, aadharLast4);

        if (!verificationResult.success) {
            return res.status(400).json({
                success: false,
                message: verificationResult.message || "Verification failed. Please check your details."
            });
        }

        // Clear any existing OTP for this user
        await OTP.deleteMany({ userId: req.user._id });

        // Try to send OTP using Twilio Verify service (no phone number required)
        let smsResult = null;
        let twilioVerifyUsed = false;

        try {
            smsResult = await twilioService.sendOTP(mobile);
            twilioVerifyUsed = true;
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to send OTP. Please try again later."
            });
        }

        // Store OTP record for Twilio Verify service
        const otpRecord = await OTP.create({
            mobile,
            aadharLast4,
            userId: req.user._id,
            governmentData: verificationResult.farmer,
            twilioVerify: twilioVerifyUsed // true when using Twilio Verify service
        });



        res.json({
            success: true,
            message: "OTP sent to your mobile number. Please verify to complete the process.",
            data: {
                otpSent: true,
                mobile: mobile.replace(/(\d{6})(\d{4})/, '$1****'),
                expiresIn: 600 // 10 minutes
            }
        });

    } catch (error) {
        console.error("Error in farmer verification:", error);
        res.status(500).json({
            success: false,
            message: "Server error during verification",
            error: error.message
        });
    }
};

// @desc    Step 2: Verify OTP and complete farmer verification
// @route   POST /api/verification/verify-otp
// @access  Private (Farmer only)
exports.verifyOTP = async (req, res) => {
    try {
        const { otp } = req.body;



        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "Please provide the OTP"
            });
        }

        // Find the OTP record for this user
        const otpRecord = await OTP.findOne({
            userId: req.user._id,
            verified: false
        }).sort({ createdAt: -1 });



        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "No pending OTP verification found. Please request a new OTP."
            });
        }

        // Check if OTP has expired
        if (new Date() > otpRecord.expiresAt) {
            await OTP.findByIdAndDelete(otpRecord._id);
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one."
            });
        }

        // Verify OTP based on the method used
        let isOTPValid = false;

        if (otpRecord.twilioVerify) {
            // Use Twilio Verify service
            const twilioResult = await twilioService.verifyOTP(otpRecord.mobile, otp);
            if (twilioResult.success) {
                isOTPValid = true;
            } else {
                // Increment attempts for failed Twilio verification
                otpRecord.attempts += 1;
                await otpRecord.save();

                const remainingAttempts = 3 - otpRecord.attempts;
                if (otpRecord.attempts >= 3) {
                    await OTP.findByIdAndDelete(otpRecord._id);
                    return res.status(400).json({
                        success: false,
                        message: "Maximum OTP attempts exceeded. Please request a new OTP."
                    });
                }

                return res.status(400).json({
                    success: false,
                    message: `Invalid OTP. ${remainingAttempts} attempts remaining.`
                });
            }
        } else {
            // Use manual OTP verification (fallback method)
            try {
                isOTPValid = otpRecord.verifyOTP(otp);
                await otpRecord.save();
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            if (!isOTPValid) {
                await otpRecord.save(); // Save the updated attempts count
                const remainingAttempts = 3 - otpRecord.attempts;
                return res.status(400).json({
                    success: false,
                    message: `Invalid OTP. ${remainingAttempts} attempts remaining.`
                });
            }
        }

        // OTP verified successfully - now complete the farmer verification
        const existingProfile = await FarmerProfile.findOne({ user: req.user._id });

        let farmerProfile = existingProfile;
        if (!farmerProfile) {
            // Create a basic profile if it doesn't exist
            farmerProfile = await FarmerProfile.create({
                user: req.user._id,
                farmName: req.user.name + "'s Farm",
                description: "Farm description will be updated soon.",
                isVerified: true,
                verificationDetails: {
                    method: 'government_data',
                    verifiedAt: new Date(),
                    verifiedBy: 'system',
                    governmentData: otpRecord.governmentData
                }
            });
        } else {
            farmerProfile.isVerified = true;
            farmerProfile.verificationDetails = {
                method: 'government_data',
                verifiedAt: new Date(),
                verifiedBy: 'system',
                governmentData: otpRecord.governmentData
            };
            await farmerProfile.save();
        }

        // Clean up the OTP record
        await OTP.findByIdAndDelete(otpRecord._id);

        res.json({
            success: true,
            message: "Farmer verified successfully!",
            data: {
                isVerified: true,
                farmer: otpRecord.governmentData
            }
        });

    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({
            success: false,
            message: "Server error during OTP verification",
            error: error.message
        });
    }
};

// @desc    Get farmer verification status
// @route   GET /api/verification/status
// @access  Private (Farmer only)
exports.getVerificationStatus = async (req, res) => {
    try {
        const farmerProfile = await FarmerProfile.findOne({ user: req.user._id });

        res.json({
            success: true,
            data: {
                isVerified: farmerProfile ? farmerProfile.isVerified : false,
                hasProfile: !!farmerProfile
            }
        });
    } catch (error) {
        console.error("Error getting verification status:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// @desc    Request manual verification (for future implementation)
// @route   POST /api/verification/manual-request
// @access  Private (Farmer only)
exports.requestManualVerification = async (req, res) => {
    try {
        // This is a placeholder for future manual verification implementation
        // For now, we'll just return a message

        res.json({
            success: true,
            message: "Manual verification request submitted. Our team will review your documents within 2-3 business days."
        });
    } catch (error) {
        console.error("Error requesting manual verification:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// @desc    Get verification statistics (Admin only)
// @route   GET /api/verification/stats
// @access  Private (Admin only)
exports.getVerificationStats = async (req, res) => {
    try {
        const govStats = await MockGovernmentData.getVerificationStats();

        const farmerStats = await FarmerProfile.aggregate([
            {
                $group: {
                    _id: null,
                    totalFarmers: { $sum: 1 },
                    verifiedFarmers: {
                        $sum: { $cond: ["$isVerified", 1, 0] }
                    }
                }
            }
        ]);

        const stats = farmerStats[0] || { totalFarmers: 0, verifiedFarmers: 0 };

        res.json({
            success: true,
            data: {
                farmers: {
                    total: stats.totalFarmers,
                    verified: stats.verifiedFarmers,
                    unverified: stats.totalFarmers - stats.verifiedFarmers,
                    verificationRate: stats.totalFarmers > 0 ? ((stats.verifiedFarmers / stats.totalFarmers) * 100).toFixed(2) : 0
                },
                government: govStats
            }
        });
    } catch (error) {
        console.error("Error getting verification stats:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// @desc    Resend OTP for farmer verification
// @route   POST /api/verification/resend-otp
// @access  Private (Farmer only)
exports.resendOTP = async (req, res) => {
    try {
        // Find the existing OTP record for this user
        const otpRecord = await OTP.findOne({
            userId: req.user._id,
            verified: false
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "No pending verification found. Please start verification again."
            });
        }

        // Clear the existing OTP record
        await OTP.findByIdAndDelete(otpRecord._id);

        // Try to resend OTP using Twilio Verify service
        let smsResult = null;
        let twilioVerifyUsed = false;

        try {
            smsResult = await twilioService.sendOTP(otpRecord.mobile);
            twilioVerifyUsed = true;
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to resend OTP. Please try again later."
            });
        }

        // Store new OTP record for Twilio Verify service
        await OTP.create({
            mobile: otpRecord.mobile,
            aadharLast4: otpRecord.aadharLast4,
            userId: req.user._id,
            governmentData: otpRecord.governmentData,
            twilioVerify: twilioVerifyUsed // true when using Twilio Verify service
        });

        res.json({
            success: true,
            message: "OTP resent to your mobile number.",
            data: {
                otpSent: true,
                mobile: otpRecord.mobile.replace(/(\d{6})(\d{4})/, '$1****'),
                expiresIn: 600 // 10 minutes
            }
        });

    } catch (error) {
        console.error("Error resending OTP:", error);
        res.status(500).json({
            success: false,
            message: "Server error during OTP resend",
            error: error.message
        });
    }
};


