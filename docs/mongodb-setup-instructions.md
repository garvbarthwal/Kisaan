# MongoDB Setup and Mock Data Instructions

## Prerequisites

Before running the mock data seeding script, ensure you have one of the following:

### Option 1: Local MongoDB Setup

1. **Install MongoDB Community Edition**

   - Download from: https://www.mongodb.com/try/download/community
   - Install and start the MongoDB service
   - Ensure MongoDB is running on `mongodb://localhost:27017`

2. **Start MongoDB Service (Windows)**
   ```cmd
   net start MongoDB
   ```

### Option 2: MongoDB Atlas (Cloud - Recommended)

1. Create a free account at https://cloud.mongodb.com
2. Create a new cluster
3. Get your connection string
4. Update your `.env` file with the Atlas connection string

## Running the Mock Data Script

### Step 1: Navigate to API Directory

```cmd
cd f:\kisaan\Kisaan\api
```

### Step 2: Install Dependencies (if not already done)

```cmd
npm install
```

### Step 3: Set up Environment Variables

Create a `.env` file in the `api` directory with:

```env
MONGO_URI=mongodb://localhost:27017/kisanbazar
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/kisanbazar
```

### Step 4: Run the Seeding Script

```cmd
node seedMockData.js
```

## Expected Output

When the script runs successfully, you should see:

```
🔌 Connecting to MongoDB...
📍 Using MongoDB URI: mongodb://localhost:27017/kisanbazar
✅ Connected to MongoDB successfully!
🗑️  Cleared 0 existing records
📥 Successfully inserted 10 mock farmer records

📋 Inserted Mock Government Data:
==================================================
1. Ramesh Yadav
   📱 Mobile: 9876543210
   🆔 Aadhar: 1234-5678-9123 (Last 4: 9123)
   🏛️  PM-KISAN: PMKISANUP001

[... more records ...]

🧪 Testing Verification System:
==============================
✅ Test 1 (Valid): PASSED
✅ Test 2 (Invalid): PASSED

🎉 Mock government data seeding completed successfully!

💡 Test with these credentials:
   Mobile: 9876543210, Last 4 Aadhar: 9123 (Ramesh Yadav)
   Mobile: 9123456780, Last 4 Aadhar: 1234 (Sita Devi)
```

## Troubleshooting

### Error: `connect ECONNREFUSED`

- **Issue**: MongoDB is not running locally
- **Solution**: Start MongoDB service or use MongoDB Atlas

### Error: `Cannot find module 'mongoose'`

- **Issue**: Dependencies not installed
- **Solution**: Run `npm install` in the api directory

### Error: `Duplicate key error`

- **Issue**: Mock data already exists in database
- **Solution**: This is normal - the script clears existing data first

## Using Mock Data for Verification

Once the mock data is seeded, you can test farmer verification with these test cases:

### Valid Test Cases (should succeed)

- Mobile: `9876543210`, Last 4 Aadhar: `9123` → Ramesh Yadav
- Mobile: `9123456780`, Last 4 Aadhar: `1234` → Sita Devi
- Mobile: `9988776655`, Last 4 Aadhar: `2345` → Mohd. Imran

### Invalid Test Cases (should fail)

- Mobile: `9999999999`, Last 4 Aadhar: `0000` → No match
- Mobile: `9876543210`, Last 4 Aadhar: `0000` → Wrong Aadhar
- Mobile: `0000000000`, Last 4 Aadhar: `9123` → Wrong mobile

## Next Steps

1. **Implement Verification API**: Create API endpoints to use this mock data
2. **Add OTP Service**: Integrate SMS service for OTP verification
3. **Create Frontend Forms**: Build farmer verification forms
4. **Add Manual Verification**: Implement document upload for failed verifications
