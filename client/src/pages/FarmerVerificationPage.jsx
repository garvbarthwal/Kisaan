import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    getVerificationStatus,
    clearVerificationError,
    clearVerificationSuccess
} from '../redux/slices/verificationSlice';
import FarmerVerificationModal from '../components/FarmerVerificationModal';
import VerificationBadge from '../components/VerificationBadge';
import Loader from '../components/Loader';
import {
    FaShieldAlt,
    FaCheckCircle,
    FaExclamationTriangle,
    FaArrowLeft
} from 'react-icons/fa';

const FarmerVerificationPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { isVerified, hasProfile, loading } = useSelector((state) => state.verification);

    const [showVerificationModal, setShowVerificationModal] = useState(false);

    useEffect(() => {
        // Redirect if not a farmer
        if (user && user.role !== 'farmer') {
            navigate('/');
            return;
        }

        // Fetch verification status
        if (user && user.role === 'farmer') {
            dispatch(getVerificationStatus());
        }
    }, [dispatch, user, navigate]);

    const handleVerificationSuccess = () => {
        setShowVerificationModal(false);
        dispatch(getVerificationStatus());
        // Redirect to profile after verification
        setTimeout(() => {
            navigate('/profile');
        }, 1500);
    };

    if (loading) {
        return <Loader />;
    }

    if (!user || user.role !== 'farmer') {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            {/* Header */}
            <div className="flex items-center mb-8">
                <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center text-gray-600 hover:text-green-700 mr-4"
                >
                    <FaArrowLeft className="mr-2" />
                    Back to Profile
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                        <FaShieldAlt className="text-green-500 text-3xl" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Farmer Verification
                    </h1>
                    <p className="text-gray-600">
                        Get verified to build trust with customers and increase your sales
                    </p>
                </div>

                {/* Current Status */}
                <div className="mb-8">
                    <div className={`p-6 rounded-xl border-2 ${isVerified
                            ? 'border-green-200 bg-green-50'
                            : 'border-yellow-200 bg-yellow-50'
                        }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {isVerified ? (
                                    <FaCheckCircle className="text-green-500 text-2xl" />
                                ) : (
                                    <FaExclamationTriangle className="text-yellow-500 text-2xl" />
                                )}
                                <div>
                                    <h3 className="font-semibold text-lg">
                                        {isVerified ? 'Verification Complete' : 'Verification Pending'}
                                    </h3>
                                    <p className={`text-sm ${isVerified ? 'text-green-700' : 'text-yellow-700'
                                        }`}>
                                        {isVerified
                                            ? 'Your farm has been verified with government records'
                                            : 'Complete verification to gain customer trust'
                                        }
                                    </p>
                                </div>
                            </div>
                            <VerificationBadge
                                isVerified={isVerified}
                                size="lg"
                                style="badge"
                                showText={true}
                            />
                        </div>
                    </div>
                </div>

                {/* Benefits of Verification */}
                <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">Benefits of Getting Verified</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                            <FaCheckCircle className="text-blue-500 mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-medium text-blue-900">Build Trust</h4>
                                <p className="text-sm text-blue-700">Customers trust verified farmers more</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                            <FaCheckCircle className="text-purple-500 mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-medium text-purple-900">Increase Sales</h4>
                                <p className="text-sm text-purple-700">Verified farms get more orders</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                            <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-medium text-green-900">Priority Listing</h4>
                                <p className="text-sm text-green-700">Appear higher in search results</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                            <FaCheckCircle className="text-orange-500 mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-medium text-orange-900">Better Support</h4>
                                <p className="text-sm text-orange-700">Get priority customer support</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Verification Process */}
                <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">How Verification Works</h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                1
                            </div>
                            <div>
                                <h4 className="font-medium">Enter Mobile & Aadhar Details</h4>
                                <p className="text-sm text-gray-600">Provide your Aadhar-linked mobile number and last 4 digits of Aadhar</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                2
                            </div>
                            <div>
                                <h4 className="font-medium">Automatic Verification</h4>
                                <p className="text-sm text-gray-600">We verify your details against government databases instantly</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                3
                            </div>
                            <div>
                                <h4 className="font-medium">Get Verified Badge</h4>
                                <p className="text-sm text-gray-600">Receive your verification badge immediately upon successful verification</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center">
                    {!isVerified ? (
                        <button
                            onClick={() => setShowVerificationModal(true)}
                            className="bg-green-500 text-white py-3 px-8 rounded-lg hover:bg-green-600 transition-colors font-semibold text-lg"
                        >
                            Start Verification
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate('/profile')}
                            className="bg-blue-500 text-white py-3 px-8 rounded-lg hover:bg-blue-600 transition-colors font-semibold text-lg"
                        >
                            Go to Profile
                        </button>
                    )}
                </div>
            </div>

            {/* Verification Modal */}
            <FarmerVerificationModal
                isOpen={showVerificationModal}
                onClose={() => setShowVerificationModal(false)}
                onVerificationSuccess={handleVerificationSuccess}
            />
        </div>
    );
};

export default FarmerVerificationPage;
