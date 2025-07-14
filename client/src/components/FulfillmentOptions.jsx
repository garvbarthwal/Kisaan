import React, { useState } from "react";
import { FaTruck, FaMapMarkerAlt, FaClock, FaEdit, FaInfoCircle, FaCheck, FaTimes } from "react-icons/fa";

const defaultPickupSchedule = {
    useBusinessHours: true,
    customHours: {
        monday: { open: "", close: "", closed: false },
        tuesday: { open: "", close: "", closed: false },
        wednesday: { open: "", close: "", closed: false },
        thursday: { open: "", close: "", closed: false },
        friday: { open: "", close: "", closed: false },
        saturday: { open: "", close: "", closed: false },
        sunday: { open: "", close: "", closed: false },
    },
};

const FulfillmentOptions = ({
    formData,
    setFormData,
    errors = {},
    myFarmerProfile,
    pickupSchedule,
    setPickupSchedule,
    showPickupModal,
    setShowPickupModal,
}) => {
    // Handlers for pickup modal logic can be passed in or defined here if needed
    return (
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
                Fulfillment Options*
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Delivery Option */}
                <div className={`group relative p-4 border-2 rounded-xl transition-all duration-300 cursor-pointer hover:shadow-md ${formData.fulfillmentOptions.delivery
                    ? 'border-green-500 bg-green-50 shadow-sm'
                    : 'border-gray-200 hover:border-green-300'
                    }`}>
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <input
                                type="checkbox"
                                id="delivery"
                                name="fulfillmentOptions.delivery"
                                checked={formData.fulfillmentOptions.delivery}
                                onChange={e => setFormData(prev => ({
                                    ...prev,
                                    fulfillmentOptions: {
                                        ...prev.fulfillmentOptions,
                                        delivery: e.target.checked,
                                    },
                                }))}
                                className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded transition-all"
                            />
                        </div>
                        <div className="flex items-center space-x-3 flex-1">
                            <div className={`p-2 rounded-lg transition-colors ${formData.fulfillmentOptions.delivery
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-green-600 group-hover:bg-green-100'
                                }`}>
                                <FaTruck className="text-lg" />
                            </div>
                            <div>
                                <label htmlFor="delivery" className="block text-sm font-semibold text-gray-900 cursor-pointer">
                                    Delivery
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    We'll deliver to customers
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Pickup Option */}
                <div className={`group relative p-4 border-2 rounded-xl transition-all duration-300 cursor-pointer hover:shadow-md ${formData.fulfillmentOptions.pickup
                    ? 'border-green-500 bg-green-50 shadow-sm'
                    : 'border-gray-200 hover:border-green-300'
                    }`}>
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <input
                                type="checkbox"
                                id="pickup"
                                name="fulfillmentOptions.pickup"
                                checked={formData.fulfillmentOptions.pickup}
                                onChange={e => setFormData(prev => ({
                                    ...prev,
                                    fulfillmentOptions: {
                                        ...prev.fulfillmentOptions,
                                        pickup: e.target.checked,
                                    },
                                }))}
                                className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded transition-all"
                            />
                        </div>
                        <div className="flex items-center space-x-3 flex-1">
                            <div className={`p-2 rounded-lg transition-colors ${formData.fulfillmentOptions.pickup
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-green-600 group-hover:bg-green-100'
                                }`}>
                                <FaMapMarkerAlt className="text-lg" />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="pickup" className="block text-sm font-semibold text-gray-900 cursor-pointer">
                                    Pickup
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Customers pick up from farm
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Pickup hours preview and modal trigger */}
                    {formData.fulfillmentOptions.pickup && (
                        <div className="mt-4 pt-4 border-t border-green-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <FaClock className="text-green-600 text-sm" />
                                    <span className="text-sm font-medium text-gray-700">
                                        {formData.pickupHours
                                            ? 'Custom pickup hours'
                                            : pickupSchedule.useBusinessHours
                                                ? 'Using business hours'
                                                : 'Hours not configured'
                                        }
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowPickupModal(true)}
                                    className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <FaEdit className="text-xs" />
                                    <span>Configure</span>
                                </button>
                            </div>
                            {(formData.pickupHours || (pickupSchedule.useBusinessHours && myFarmerProfile?.businessHours)) && (
                                <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <FaInfoCircle className="text-green-600 text-sm" />
                                        <span className="text-sm font-medium text-gray-700">Pickup Hours Preview</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                                        {Object.entries(
                                            formData.pickupHours ||
                                            (pickupSchedule.useBusinessHours ? myFarmerProfile?.businessHours : {})
                                        ).map(([day, hours]) => (
                                            <div key={day} className="flex flex-col items-start">
                                                <span className="capitalize text-gray-600 mb-1">{day.slice(0, 3)}</span>
                                                <span className={`font-medium ${hours.closed ? 'text-red-500' : 'text-green-600'}`}>
                                                    {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {errors.fulfillmentOptions && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <FaInfoCircle className="text-red-500 text-sm" />
                        <p className="text-red-600 text-sm font-medium">{errors.fulfillmentOptions}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FulfillmentOptions;
