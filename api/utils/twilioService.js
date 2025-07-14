const twilio = require('twilio');

class TwilioService {
    constructor() {
        this.accountSid = process.env.TWILIO_ACCOUNT_SID;
        this.authToken = process.env.TWILIO_AUTH_TOKEN;
        this.serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

        if (this.accountSid && this.authToken) {
            try {
                this.client = twilio(this.accountSid, this.authToken);
            } catch (error) {
                this.client = null;
            }
        } else {
            this.client = null;
        }
    }

    async sendOTP(phoneNumber) {
        try {
            if (!this.client) {
                throw new Error('Twilio not configured properly');
            }

            if (!this.serviceSid) {
                throw new Error('Twilio not configured properly');
            }

            // Format phone number to E.164 format (add +91 for India)
            const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

            const verification = await this.client.verify.v2
                .services(this.serviceSid)
                .verifications
                .create({
                    to: formattedNumber,
                    channel: 'sms'
                });

            return {
                success: true,
                status: verification.status,
                message: 'OTP sent successfully'
            };
        } catch (error) {
            throw new Error('Twilio not configured properly');
        }
    }

    async verifyOTP(phoneNumber, code) {
        try {
            if (!this.client) {
                return {
                    success: false,
                    message: 'SMS service not configured. Please contact administrator.'
                };
            }

            if (!this.serviceSid) {
                return {
                    success: false,
                    message: 'Verification service not configured. Please contact administrator.'
                };
            }

            // Format phone number to E.164 format
            const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

            const verificationCheck = await this.client.verify.v2
                .services(this.serviceSid)
                .verificationChecks
                .create({
                    to: formattedNumber,
                    code: code
                });

            return {
                success: verificationCheck.status === 'approved',
                status: verificationCheck.status,
                message: verificationCheck.status === 'approved' ? 'OTP verified successfully' : 'Invalid OTP'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to verify OTP'
            };
        }
    }

    // Alternative method using simple SMS (for development/testing without Verify service)
    // NOTE: This method requires a purchased Twilio phone number and is not recommended
    async sendSimpleOTP(phoneNumber, otp) {
        throw new Error('Simple OTP method is disabled. Use Twilio Verify service instead.');
    }

    // Test method to verify Twilio configuration
    async testConfiguration() {
        try {
            if (!this.client) {
                return {
                    success: false,
                    message: 'Twilio client not initialized. Check credentials.'
                };
            }

            // Test by fetching account information
            const account = await this.client.api.accounts(this.accountSid).fetch();

            return {
                success: true,
                message: 'Twilio configuration is valid',
                accountSid: account.sid,
                accountStatus: account.status
            };
        } catch (error) {
            return {
                success: false,
                message: `Configuration test failed: ${error.message}`
            };
        }
    }
}

module.exports = new TwilioService();
