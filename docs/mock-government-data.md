# Mock Government Data for Farmer Verification

## Overview

This document describes the mock government data system implemented in the Kisaan platform for farmer verification. The mock data simulates real government databases that would typically be used to verify farmer identities in a production environment.

## Purpose

The mock government data serves several important purposes:

1. **Testing Farmer Verification Process**: Allows developers and testers to simulate the farmer verification workflow without connecting to actual government APIs.

2. **Development Environment**: Provides a controlled dataset for testing the verification logic during development.

3. **Demonstration**: Enables demonstration of the verification feature to stakeholders and users.

4. **API Integration Testing**: Tests the integration between the Kisaan platform and government verification systems.

## Mock Data Structure

The mock government database contains the following farmer records:

| Name            | Mobile     | Aadhar (Last 4 digits) | PM-KISAN ID  |
| --------------- | ---------- | ---------------------- | ------------ |
| Ramesh Yadav    | 9876543210 | 9123                   | PMKISANUP001 |
| Sita Devi       | 9123456780 | 1234                   | PMKISANBR002 |
| Mohd. Imran     | 9988776655 | 2345                   | PMKISANRJ003 |
| Lakshmi Bai     | 9012345678 | 3456                   | PMKISANTN004 |
| Harbhajan Singh | 9876012345 | 4567                   | PMKISANPB005 |
| Meena Kumari    | 7890123456 | 5678                   | PMKISANMH006 |
| Ganesh Rao      | 8001234567 | 6789                   | PMKISANKA007 |
| Radha Patel     | 7700123456 | 7891                   | PMKISANGJ008 |
| Anil Kumar      | 7600123456 | 8912                   | PMKISAND009  |
| Kavita Sharma   | 7500123456 | 8912                   | PMKISANHP010 |

## Testing with Real Phone Numbers

**Important for Testing**: To test the Twilio SMS functionality with your own phone number, you need to replace one of the mock data entries in the database with your own mobile number.

### How to Update Mock Data for Testing:

1. **Connect to your MongoDB database** using MongoDB Compass or the MongoDB shell
2. **Navigate to the `mockgovernmentdata` collection**
3. **Replace any one entry** with your details:
   ```json
   {
     "name": "Your Name",
     "mobile": "your_10_digit_mobile_number",
     "aadharLast4": "any_4_digits",
     "pmKisanId": "PMKISANTEST001",
     "state": "Your State",
     "district": "Your District"
   }
   ```
4. **Use these credentials** in the app to test OTP verification

This allows you to receive actual SMS messages during testing while keeping the other mock data intact for demonstration purposes.

## Farmer Verification Process

### Primary Verification Method (Automated)

The farmer verification process follows these steps:

1. **Data Entry**: The farmer enters:

   - Mobile number linked with Aadhar
   - Last 4 digits of their Aadhar number

2. **Database Lookup**: The system searches the mock government data for a match based on:

   - Mobile number
   - Last 4 digits of Aadhar number

3. **OTP Verification**: If a match is found:

   - An OTP (One-Time Password) is sent to the registered mobile number
   - The farmer enters the OTP to complete verification
   - Upon successful OTP verification, the farmer is marked as verified

4. **Success**: The farmer profile is automatically verified and gains access to farmer-specific features.

### Secondary Verification Method (Manual)

If the automated verification fails, the farmer can opt for manual verification:

1. **Document Upload**: The farmer must upload one or more of the following documents:

   - Aadhar Card (front and back)
   - Land ownership documents
   - Farmer registration certificate
   - PM-KISAN beneficiary card
   - Any other valid government-issued farming proof

2. **Manual Review**: Admin users review the uploaded documents

3. **Verification Decision**: Admin approves or rejects the verification request

4. **Notification**: The farmer is notified of the verification status

## Technical Implementation

### Database Schema

```javascript
{
  name: String,           // Farmer's full name
  mobile: String,         // Mobile number (unique)
  aadhar: String,         // Full Aadhar number (masked for security)
  pmKisanId: String,      // PM-KISAN beneficiary ID (unique)
  createdAt: Date         // Record creation timestamp
}
```

### Verification Logic

```javascript
// Pseudo-code for verification
const verifyFarmer = async (mobile, aadharLast4) => {
  const farmer = await MockGovernmentData.findOne({
    mobile: mobile,
    aadhar: { $regex: `${aadharLast4}$` },
  });

  if (farmer) {
    // Send OTP and proceed with verification
    return { success: true, requiresOTP: true };
  } else {
    // Require manual verification
    return { success: false, requiresManualVerification: true };
  }
};
```

## Security Considerations

1. **Data Masking**: Aadhar numbers are stored in a masked format for privacy
2. **OTP Expiry**: OTPs expire after a set time limit (typically 5-10 minutes)
3. **Rate Limiting**: Verification attempts are rate-limited to prevent abuse
4. **Document Security**: Uploaded documents are stored securely and encrypted
5. **Access Control**: Only authorized admin users can perform manual verification

## Testing Scenarios

### Successful Verification Test Cases

- **Test Case 1**: Mobile: 9876543210, Last 4 digits: 9123 (Ramesh Yadav)
- **Test Case 2**: Mobile: 9123456780, Last 4 digits: 1234 (Sita Devi)
- **Test Case 3**: Mobile: 9988776655, Last 4 digits: 2345 (Mohd. Imran)

### Failed Verification Test Cases

- **Test Case 1**: Mobile: 9999999999, Last 4 digits: 0000 (No match)
- **Test Case 2**: Mobile: 9876543210, Last 4 digits: 0000 (Wrong Aadhar digits)
- **Test Case 3**: Mobile: 0000000000, Last 4 digits: 9123 (Wrong mobile)

## Production Considerations

In a production environment, this mock data system would be replaced with:

1. **Government API Integration**: Direct integration with UIDAI (Aadhar) and PM-KISAN APIs
2. **Real-time Verification**: Live verification against government databases
3. **Enhanced Security**: Additional security measures for handling sensitive government data
4. **Compliance**: Adherence to government data protection and privacy regulations
5. **Audit Trails**: Comprehensive logging of all verification activities

## Usage Instructions

1. **Seeding Data**: Run the seeding script to populate the mock government data
2. **Testing**: Use the provided test cases to verify the system functionality
3. **Development**: Modify the mock data as needed for additional test scenarios
4. **Demo**: Use the mock data to demonstrate the verification process to stakeholders

---

_Note: This mock data is for development and testing purposes only. In production, real government APIs and databases should be used for farmer verification._
