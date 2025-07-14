// Simple script to seed mock government data
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Use a default MongoDB URI if not provided
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/kisanbazar";

console.log("🚀 Mock Government Data Seeding Script");
console.log("=====================================");

// Mock Government Data Schema
const mockGovernmentDataSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, unique: true },
    aadhar: { type: String, required: true, unique: true },
    pmKisanId: { type: String, required: true, unique: true },
    verificationCount: { type: Number, default: 0 },
    lastVerificationAttempt: { type: Date },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Method to get last 4 digits of Aadhar
mockGovernmentDataSchema.methods.getAadharLast4 = function () {
    return this.aadhar.slice(-4);
};

// Method to verify farmer
mockGovernmentDataSchema.statics.verifyFarmer = async function (mobile, aadharLast4) {
    try {
        const farmer = await this.findOne({
            mobile: mobile,
            aadhar: { $regex: `${aadharLast4}$` },
            isActive: true
        });

        if (farmer) {
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

const MockGovernmentData = mongoose.model("MockGovernmentData", mockGovernmentDataSchema);

// Mock data
const mockFarmersData = [
    { name: "Ramesh Yadav", mobile: "9876543210", aadhar: "1234-5678-9123", pmKisanId: "PMKISANUP001" },
    { name: "Sita Devi", mobile: "9123456780", aadhar: "2345-6789-1234", pmKisanId: "PMKISANBR002" },
    { name: "Mohd. Imran", mobile: "9988776655", aadhar: "3456-7891-2345", pmKisanId: "PMKISANRJ003" },
    { name: "Lakshmi Bai", mobile: "9012345678", aadhar: "4567-8912-3456", pmKisanId: "PMKISANTN004" },
    { name: "Harbhajan Singh", mobile: "9876012345", aadhar: "5678-9123-4567", pmKisanId: "PMKISANPB005" },
    { name: "Meena Kumari", mobile: "7890123456", aadhar: "6789-1234-5678", pmKisanId: "PMKISANMH006" },
    { name: "Ganesh Rao", mobile: "8001234567", aadhar: "7891-2345-6789", pmKisanId: "PMKISANKA007" },
    { name: "Radha Patel", mobile: "7700123456", aadhar: "8912-3456-7891", pmKisanId: "PMKISANGJ008" },
    { name: "Anil Kumar", mobile: "7600123456", aadhar: "9123-4567-8912", pmKisanId: "PMKISAND009" },
    { name: "Kavita Sharma", mobile: "7500123456", aadhar: "1023-5647-8912", pmKisanId: "PMKISANHP010" }
];

// Seed function
const seedMockData = async () => {
    try {
        console.log("🔌 Connecting to MongoDB...");
        console.log(`📍 Using MongoDB URI: ${MONGO_URI}`);

        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB successfully!");

        // Clear existing data
        const deleteResult = await MockGovernmentData.deleteMany({});
        console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing records`);

        // Insert new data
        const result = await MockGovernmentData.insertMany(mockFarmersData);
        console.log(`📥 Successfully inserted ${result.length} mock farmer records`);

        // Display data
        console.log("\n📋 Inserted Mock Government Data:");
        console.log("=".repeat(50));
        result.forEach((farmer, index) => {
            console.log(`${index + 1}. ${farmer.name}`);
            console.log(`   📱 Mobile: ${farmer.mobile}`);
            console.log(`   🆔 Aadhar: ${farmer.aadhar} (Last 4: ${farmer.getAadharLast4()})`);
            console.log(`   🏛️  PM-KISAN: ${farmer.pmKisanId}`);
            console.log("");
        });

        // Test verification
        console.log("🧪 Testing Verification System:");
        console.log("=".repeat(30));

        const test1 = await MockGovernmentData.verifyFarmer("9876543210", "9123");
        console.log(`✅ Test 1 (Valid): ${test1.success ? "PASSED" : "FAILED"}`);

        const test2 = await MockGovernmentData.verifyFarmer("9999999999", "0000");
        console.log(`✅ Test 2 (Invalid): ${!test2.success ? "PASSED" : "FAILED"}`);

        console.log("\n🎉 Mock government data seeding completed successfully!");
        console.log("\n💡 Test with these credentials:");
        console.log("   Mobile: 9876543210, Last 4 Aadhar: 9123 (Ramesh Yadav)");
        console.log("   Mobile: 9123456780, Last 4 Aadhar: 1234 (Sita Devi)");

    } catch (error) {
        console.error("❌ Error:", error.message);
        if (error.code === 11000) {
            console.error("💡 Tip: Duplicate records exist. Data may already be seeded.");
        }
    } finally {
        await mongoose.connection.close();
        console.log("🔌 Database connection closed");
        process.exit(0);
    }
};

// Run if called directly
if (require.main === module) {
    seedMockData();
}

module.exports = { MockGovernmentData, seedMockData };
