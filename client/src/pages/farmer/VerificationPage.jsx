import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
    getVerificationStatus,
    verifyFarmer,
    verifyOTP,
    resendOTP,
    requestManualVerification,
    clearVerificationError,
    clearVerificationSuccess
} from '../../redux/slices/verificationSlice';
import { getMyFarmerProfile } from '../../redux/slices/farmerSlice';
import Loader from '../../components/Loader';
import VerificationBadge from '../../components/VerificationBadge';
import {
    FaShieldAlt,
    FaCheckCircle,
    FaSpinner,
    FaFileUpload,
    FaInfoCircle,
    FaArrowLeft,
    FaTimes,
    FaExclamationTriangle,
    FaMobileAlt,
    FaRedo
} from 'react-icons/fa';

const VerificationPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user } = useSelector((state) => state.auth);
    const {
        isVerified,
        hasProfile,
        loading,
        verifying,
        verifyingOTP,
        resendingOTP,
        otpSent,
        maskedMobile,
        otpExpiresIn,
        error,
        success,
        verificationMessage
    } = useSelector((state) => state.verification);

    const [currentStep, setCurrentStep] = useState('welcome'); // 'welcome', 'form', 'otp', 'success', 'manual', 'verified'
    const [formData, setFormData] = useState({
        mobile: '',
        aadharLast4: ''
    });
    const [otpCode, setOtpCode] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user?.role === 'farmer') {
            dispatch(getVerificationStatus());
        }
    }, [dispatch, user?.role]);

    useEffect(() => {
        if (isVerified) {
            setCurrentStep('verified');
        }
    }, [isVerified]);

    useEffect(() => {
        if (success && verificationMessage && !otpSent) {
            setCurrentStep('success');
        } else if (otpSent) {
            setCurrentStep('otp');
            setCountdown(otpExpiresIn || 600);
        }
    }, [success, verificationMessage, otpSent, otpExpiresIn]);

    // Countdown timer for OTP expiry
    useEffect(() => {
        let timer;
        if (countdown > 0 && currentStep === 'otp') {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown, currentStep]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.mobile) {
            newErrors.mobile = 'Mobile number is required';
        } else if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
            newErrors.mobile = 'Please enter a valid Indian mobile number';
        }

        if (!formData.aadharLast4) {
            newErrors.aadharLast4 = 'Last 4 digits of Aadhar are required';
        } else if (!/^\d{4}$/.test(formData.aadharLast4)) {
            newErrors.aadharLast4 = 'Please enter exactly 4 digits';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        dispatch(verifyFarmer(formData));
    };

    const handleManualVerification = () => {
        dispatch(requestManualVerification());
        setCurrentStep('manual');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSkipForNow = () => {
        navigate('/farmer/dashboard');
    };

    const handleContinue = () => {
        dispatch(getMyFarmerProfile());
        navigate('/farmer/dashboard');
    };

    const handleOTPSubmit = (e) => {
        e.preventDefault();

        if (!otpCode) {
            setErrors({ otp: 'Please enter the OTP' });
            return;
        }

        if (!/^\d{6}$/.test(otpCode)) {
            setErrors({ otp: 'Please enter a valid 6-digit OTP' });
            return;
        }

        setErrors({});
        dispatch(verifyOTP({ otp: otpCode }));
    };

    const handleResendOTP = () => {
        dispatch(resendOTP());
        setCountdown(600); // Reset countdown
    };

    const handleOTPChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setOtpCode(value);

        if (errors.otp) {
            setErrors(prev => ({
                ...prev,
                otp: ''
            }));
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link
                        to="/farmer/dashboard"
                        className="flex items-center text-gray-600 hover:text-green-700 transition-colors"
                    >
                        <FaArrowLeft className="mr-2" />
                        Back to Dashboard
                    </Link>
                    <VerificationBadge
                        isVerified={isVerified}
                        size="md"
                        style="badge"
                        showText={true}
                    />
                </div>

                <div className="max-w-2xl mx-auto">
                    {/* Welcome Step */}
                    {currentStep === 'welcome' && !isVerified && (
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                                    <FaShieldAlt className="text-green-500 text-3xl" />
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                    Get Yourself Verified
                                </h1>
                                <p className="text-gray-600 text-lg">
                                    Build trust with consumers and unlock premium features by verifying your farmer account.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                    <h3 className="font-semibold text-green-800 mb-3">Quick Verification</h3>
                                    <ul className="text-sm text-green-700 space-y-2">
                                        <li>• Instant verification using government data</li>
                                        <li>• Just need mobile number and Aadhar last 4 digits</li>
                                        <li>• Takes less than 2 minutes</li>
                                    </ul>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                    <h3 className="font-semibold text-blue-800 mb-3">Benefits</h3>
                                    <ul className="text-sm text-blue-700 space-y-2">
                                        <li>• Verified badge on your profile</li>
                                        <li>• Higher trust with consumers</li>
                                        <li>• Priority in search results</li>
                                        <li>• Access to premium features</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => setCurrentStep('form')}
                                    className="btn btn-primary px-8"
                                >
                                    Start Verification
                                </button>
                                <button
                                    onClick={handleSkipForNow}
                                    className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Skip for Now
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Verification Form */}
                    {currentStep === 'form' && (
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                    <FaShieldAlt className="text-green-500 text-2xl" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Verify Your Identity
                                </h2>
                                <p className="text-gray-600">
                                    Enter your details to verify against government records
                                </p>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <FaInfoCircle className="text-blue-500 text-lg mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-blue-800">
                                        <p className="font-medium mb-1">How it works:</p>
                                        <p>We'll check your mobile number and Aadhar last 4 digits against PM-KISAN and other government databases. If found, you'll be verified instantly.</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                                        Aadhar Linked Mobile Number *
                                    </label>
                                    <input
                                        type="tel"
                                        id="mobile"
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleInputChange}
                                        placeholder="Enter 10-digit mobile number"
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.mobile ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        maxLength="10"
                                    />
                                    {errors.mobile && (
                                        <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="aadharLast4" className="block text-sm font-medium text-gray-700 mb-2">
                                        Last 4 Digits of Aadhar Number *
                                    </label>
                                    <input
                                        type="text"
                                        id="aadharLast4"
                                        name="aadharLast4"
                                        value={formData.aadharLast4}
                                        onChange={handleInputChange}
                                        placeholder="XXXX"
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.aadharLast4 ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        maxLength="4"
                                    />
                                    {errors.aadharLast4 && (
                                        <p className="text-red-500 text-sm mt-1">{errors.aadharLast4}</p>
                                    )}
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <FaExclamationTriangle className="text-red-500 text-lg mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-red-800 font-medium">Verification Failed</p>
                                                <p className="text-red-700 text-sm mt-1">{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={verifying}
                                        className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                    >
                                        {verifying ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            <>
                                                <FaCheckCircle />
                                                Verify Now
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep('welcome')}
                                        className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Back
                                    </button>
                                </div>
                            </form>

                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <p className="text-sm text-gray-600 mb-4 text-center">
                                    Having trouble with automatic verification?
                                </p>
                                <button
                                    onClick={handleManualVerification}
                                    className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    <FaFileUpload />
                                    Request Manual Verification
                                </button>
                            </div>
                        </div>
                    )}

                    {/* OTP Verification Step */}
                    {currentStep === 'otp' && (
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                                    <FaMobileAlt className="text-green-500 text-3xl" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    Verify Your Mobile Number
                                </h2>
                                <p className="text-gray-600 mb-4">
                                    We've sent a 6-digit verification code to
                                </p>
                                <p className="font-medium text-gray-900 text-lg mb-4">
                                    {maskedMobile}
                                </p>
                                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                    <span>Code expires in:</span>
                                    <span className="font-medium text-orange-600">
                                        {formatTime(countdown)}
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={handleOTPSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700 mb-2">
                                        Enter 6-Digit OTP *
                                    </label>
                                    <input
                                        type="text"
                                        id="otpCode"
                                        name="otpCode"
                                        value={otpCode}
                                        onChange={handleOTPChange}
                                        placeholder="123456"
                                        className={`w-full px-4 py-3 border rounded-lg text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.otp ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        maxLength="6"
                                        autoComplete="one-time-code"
                                    />
                                    {errors.otp && (
                                        <p className="text-red-500 text-sm mt-1">{errors.otp}</p>
                                    )}
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <FaExclamationTriangle className="text-red-500 text-lg mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-red-800 font-medium">OTP Verification Failed</p>
                                                <p className="text-red-700 text-sm mt-1">{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={verifyingOTP || otpCode.length !== 6}
                                        className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                    >
                                        {verifyingOTP ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                Verifying OTP...
                                            </>
                                        ) : (
                                            <>
                                                <FaCheckCircle />
                                                Verify OTP
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep('form')}
                                        className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Back
                                    </button>
                                </div>
                            </form>

                            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                                <p className="text-sm text-gray-600 mb-4">
                                    Didn't receive the code?
                                </p>
                                <button
                                    onClick={handleResendOTP}
                                    disabled={resendingOTP || countdown > 540} // Allow resend after 1 minute
                                    className="flex items-center justify-center gap-2 text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mx-auto"
                                >
                                    {resendingOTP ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            Resending...
                                        </>
                                    ) : (
                                        <>
                                            <FaRedo />
                                            Resend OTP {countdown > 540 ? `(${formatTime(600 - countdown)})` : ''}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Success Step */}
                    {currentStep === 'success' && (
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="text-center py-8">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                                    <FaCheckCircle className="text-green-500 text-3xl" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    Verification Successful!
                                </h2>
                                <p className="text-gray-600 mb-6 text-lg">
                                    {verificationMessage || 'Congratulations! You are now a verified farmer on Kisaan platform.'}
                                </p>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                                    <h3 className="font-semibold text-green-800 mb-3">What's Next?</h3>
                                    <ul className="text-sm text-green-700 space-y-2 text-left">
                                        <li>• Your profile now shows a verified badge</li>
                                        <li>• Consumers can trust your products more</li>
                                        <li>• You have access to premium features</li>
                                        <li>• Your listings get priority in search results</li>
                                    </ul>
                                </div>
                                <button
                                    onClick={handleContinue}
                                    className="btn btn-primary px-8"
                                >
                                    Continue to Dashboard
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Manual Verification Step */}
                    {currentStep === 'manual' && (
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="text-center py-8">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                                    <FaFileUpload className="text-blue-500 text-3xl" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    Manual Verification Requested
                                </h2>
                                <p className="text-gray-600 mb-6 text-lg">
                                    We've received your request for manual verification. Our team will review your case within 2-3 business days.
                                </p>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                                    <h3 className="font-semibold text-blue-800 mb-3">What to expect:</h3>
                                    <ul className="text-sm text-blue-700 space-y-2 text-left">
                                        <li>• Our team will contact you via phone or email</li>
                                        <li>• You may need to provide additional documents</li>
                                        <li>• Verification typically takes 2-3 business days</li>
                                        <li>• You'll be notified once verification is complete</li>
                                    </ul>
                                </div>
                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={handleContinue}
                                        className="btn btn-primary px-8"
                                    >
                                        Continue to Dashboard
                                    </button>
                                    <button
                                        onClick={() => setCurrentStep('form')}
                                        className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Already Verified */}
                    {currentStep === 'verified' && isVerified && (
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="text-center py-8">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                                    <FaCheckCircle className="text-green-500 text-3xl" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    You're Already Verified!
                                </h2>
                                <p className="text-gray-600 mb-6 text-lg">
                                    Your farmer account is verified and you have access to all premium features.
                                </p>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                                    <h3 className="font-semibold text-green-800 mb-3">Your Verification Benefits:</h3>
                                    <ul className="text-sm text-green-700 space-y-2 text-left">
                                        <li>• Verified badge on your profile and products</li>
                                        <li>• Enhanced consumer trust</li>
                                        <li>• Priority placement in search results</li>
                                        <li>• Access to analytics and premium tools</li>
                                    </ul>
                                </div>
                                <button
                                    onClick={handleContinue}
                                    className="btn btn-primary px-8"
                                >
                                    Go to Dashboard
                                </button>
                            </div>
                        </div>
                    )}

                    {/* OTP Step */}
                    {currentStep === 'otp' && (
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                    <FaShieldAlt className="text-green-500 text-2xl" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Enter OTP for Verification
                                </h2>
                                <p className="text-gray-600">
                                    We've sent an OTP to your registered mobile number ending with {maskedMobile}. Please enter the OTP to verify your account.
                                </p>
                            </div>

                            <form onSubmit={handleOTPSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                                        OTP *
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            id="otp"
                                            name="otp"
                                            value={otpCode}
                                            onChange={handleOTPChange}
                                            placeholder="Enter 6-digit OTP"
                                            className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.otp ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            maxLength="6"
                                        />
                                    </div>
                                    {errors.otp && (
                                        <p className="text-red-500 text-sm mt-1">{errors.otp}</p>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={verifyingOTP}
                                        className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                    >
                                        {verifyingOTP ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                Verifying OTP...
                                            </>
                                        ) : (
                                            <>
                                                <FaCheckCircle />
                                                Verify OTP
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleResendOTP}
                                        disabled={resendingOTP}
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                    >
                                        {resendingOTP ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                Resending OTP...
                                            </>
                                        ) : (
                                            <>
                                                <FaFileUpload />
                                                Resend OTP
                                            </>
                                        )}
                                    </button>
                                </div>

                                <p className="text-center text-sm text-gray-500">
                                    {`OTP expires in ${formatTime(countdown)}`}
                                </p>
                            </form>

                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <p className="text-sm text-gray-600 mb-4 text-center">
                                    Having trouble with OTP?
                                </p>
                                <button
                                    onClick={handleManualVerification}
                                    className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    <FaFileUpload />
                                    Request Manual Verification
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerificationPage;
