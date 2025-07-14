# Twilio Configuration Guide for Farmer Verification

This guide helps you set up Twilio for OTP-based farmer verification in the Kisaan app.

## Prerequisites

1. Create a Twilio account at https://www.twilio.com
2. Get your Account SID and Auth Token from the Twilio Console
3. Set up a Verify Service (recommended) or get a phone number for SMS

## Environment Configuration

Add the following variables to your `.env` file in the `api` folder:

```bash
# Twilio Configuration for OTP Verification
TWILIO_ACCOUNT_SID=your_actual_account_sid_here
TWILIO_AUTH_TOKEN=your_actual_auth_token_here
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
```

## Twilio Setup Options

### Option 1: Twilio Verify Service (Recommended)

1. Go to Twilio Console > Verify > Services
2. Create a new Verify Service
3. Copy the Service SID and add it to `TWILIO_VERIFY_SERVICE_SID`
4. This handles OTP generation, storage, and validation automatically

### Option 2: Simple SMS (Fallback)

1. Go to Twilio Console > Phone Numbers
2. Buy a phone number
3. Add it to `TWILIO_PHONE_NUMBER` in E.164 format (e.g., +1234567890)
4. This sends custom OTP messages but requires manual validation

## Verification Flow

1. **Farmer enters details**: Mobile number + last 4 digits of Aadhar
2. **Government data verification**: System checks against mock government database
3. **OTP sent via Twilio**: If data matches, OTP is sent to farmer's mobile
4. **OTP verification**: Farmer enters OTP, system verifies with Twilio
5. **Verification complete**: Farmer profile is marked as verified

## Testing

Use the following test cases from the mock government data:

- Mobile: `9876543210`, Aadhar Last 4: `9123` (Ramesh Yadav)
- Mobile: `9123456780`, Aadhar Last 4: `1234` (Sita Devi)
- Mobile: `9988776655`, Aadhar Last 4: `2345` (Mohd. Imran)

## Features Implemented

✅ **Twilio Verify Service Integration**: Uses Twilio's managed OTP service
✅ **Fallback SMS**: Custom OTP via simple SMS if Verify service fails
✅ **OTP Expiration**: 10-minute timeout for security
✅ **Attempt Limits**: Maximum 3 OTP attempts before requiring new request
✅ **Resend Functionality**: Users can request new OTP after 1 minute
✅ **Responsive UI**: Works on desktop and mobile devices
✅ **Error Handling**: Clear error messages for users
✅ **Security**: Masked phone numbers, secure OTP validation

## UI Components

The verification process includes:

1. **Initial Form**: Mobile number + Aadhar last 4 digits input
2. **OTP Screen**: 6-digit OTP input with countdown timer
3. **Success Screen**: Confirmation of verification completion
4. **Error Handling**: Helpful error messages and retry options

## Production Considerations

- Replace mock government data with real government API integration
- Implement rate limiting to prevent abuse
- Add audit logging for compliance
- Consider SMS costs and implement usage monitoring
- Add phone number validation for international support
