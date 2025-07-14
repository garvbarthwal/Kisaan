import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { FaClock, FaCheckCircle, FaInfoCircle, FaStore, FaUsers, FaHandshake, FaEdit, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import axiosInstance from "../utils/axiosConfig";

const BusinessHoursSetup = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [businessHours, setBusinessHours] = useState({
        monday: { open: "", close: "", closed: false },
        tuesday: { open: "", close: "", closed: false },
        wednesday: { open: "", close: "", closed: false },
        thursday: { open: "", close: "", closed: false },
        friday: { open: "", close: "", closed: false },
        saturday: { open: "", close: "", closed: false },
        sunday: { open: "", close: "", closed: false },
    });

    const [loading, setLoading] = useState(false);
    const [hasSetMondayHours, setHasSetMondayHours] = useState(false);
    const [checkingExistingProfile, setCheckingExistingProfile] = useState(true);

    useEffect(() => {
        // Check if user already has business hours set up
        const checkExistingProfile = async () => {
            try {
                const response = await axiosInstance.get("/api/users/farmers/my-profile");
                if (response.data.success && response.data.data && response.data.data.businessHours) {
                    const existingHours = response.data.data.businessHours;
                    // Check if any day has both open and close times set (and is not closed)
                    const hasAnyHours = Object.values(existingHours).some(day =>
                        !day.closed && day.open && day.close
                    );

                    if (hasAnyHours) {
                        // User already has business hours set up, redirect to dashboard
                        toast.info("You have already set up your business hours!");
                        navigate("/farmer/dashboard");
                        return;
                    }
                }
            } catch (error) {
                console.error("Error checking existing profile:", error);
                // Continue with setup even if there's an error
            } finally {
                setCheckingExistingProfile(false);
            }
        };

        if (user?.role === "farmer") {
            checkExistingProfile();
        } else {
            // Not a farmer, redirect to appropriate page
            navigate("/");
        }
    }, [user, navigate]);

    const daysOfWeek = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday"
    ];

    const handleTimeChange = (day, type, value) => {
        setBusinessHours(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [type]: value
            }
        }));

        // Check if this is Monday and both open and close times are set
        if (day === "monday") {
            const updatedMondayHours = { ...businessHours.monday, [type]: value };
            if (!updatedMondayHours.closed && updatedMondayHours.open && updatedMondayHours.close) {
                setHasSetMondayHours(true);
            }
        }
    };

    const handleClosedToggle = (day) => {
        setBusinessHours(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                closed: !prev[day].closed,
                // Clear times when marked as closed
                open: !prev[day].closed ? "" : prev[day].open,
                close: !prev[day].closed ? "" : prev[day].close
            }
        }));

        // Update Monday hours status
        if (day === "monday") {
            if (businessHours.monday.closed) {
                // If currently closed, now it will be open, so reset status
                setHasSetMondayHours(false);
            } else {
                // If currently open, now it will be closed, so clear status
                setHasSetMondayHours(false);
            }
        }
    };

    const handleSameForAll = () => {
        if (!businessHours.monday.closed && businessHours.monday.open && businessHours.monday.close) {
            const mondayHours = businessHours.monday;
            const updatedHours = {};

            daysOfWeek.forEach(day => {
                updatedHours[day] = { ...mondayHours };
            });

            setBusinessHours(updatedHours);
            toast.success("Monday hours applied to all days!");
        } else {
            toast.error("Please set both opening and closing times for Monday first!");
        }
    };

    const validateTimeOrder = (day) => {
        const dayHours = businessHours[day];
        if (dayHours.closed) return true; // Closed days are always valid
        if (dayHours.open && dayHours.close) {
            return dayHours.open < dayHours.close;
        }
        return true;
    };

    const getInvalidDays = () => {
        return daysOfWeek.filter(day => {
            const dayHours = businessHours[day];
            return !dayHours.closed && (dayHours.open || dayHours.close) && !validateTimeOrder(day);
        });
    };

    const getOpenDaysCount = () => {
        return daysOfWeek.filter(day =>
            !businessHours[day].closed && businessHours[day].open && businessHours[day].close
        ).length;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate that at least one day is open with complete hours
        const openDaysCount = getOpenDaysCount();

        if (openDaysCount === 0) {
            toast.error("Please set business hours for at least one open day to continue!");
            return;
        }

        // Validate time order (opening time should be before closing time)
        const invalidDays = getInvalidDays();
        if (invalidDays.length > 0) {
            toast.error(`Please check the times for ${invalidDays.join(", ")}. Opening time must be before closing time.`);
            return;
        }

        setLoading(true);

        try {
            const response = await axiosInstance.post("/api/users/farmers/business-hours", {
                businessHours
            });

            if (response.data.success) {
                toast.success("Business hours saved successfully! Welcome to Kisaan! 🌾");
                navigate("/farmer/dashboard");
            }
        } catch (error) {
            console.error("Error saving business hours:", error);
            toast.error(error.response?.data?.message || "Failed to save business hours. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Show loading state while checking existing profile
    if (checkingExistingProfile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking your profile...</p>
                </div>
            </div>
        );
    }

    const handleSkip = () => {
        // Business hours are now mandatory, so redirect to dashboard but show a warning
        toast.warn("Business hours are required to help customers with pickups. Please set them up from your profile.");
        navigate("/farmer/dashboard");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="bg-green-100 p-4 rounded-full">
                            <FaStore className="text-green-600 text-5xl" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Welcome to Kisaan! 🌾
                    </h1>
                    <p className="text-xl text-gray-600 mb-4">
                        Let's set up your business hours to get started
                    </p>

                    {/* Benefits Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                            <div className="flex items-center justify-center mb-2">
                                <FaUsers className="text-green-500 text-2xl" />
                            </div>
                            <h3 className="font-semibold text-gray-800 mb-1">Customer Convenience</h3>
                            <p className="text-sm text-gray-600">Help customers know when they can pick up their orders</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                            <div className="flex items-center justify-center mb-2">
                                <FaHandshake className="text-blue-500 text-2xl" />
                            </div>
                            <h3 className="font-semibold text-gray-800 mb-1">Build Trust</h3>
                            <p className="text-sm text-gray-600">Clear availability reduces confusion and builds customer confidence</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-100">
                            <div className="flex items-center justify-center mb-2">
                                <FaEdit className="text-purple-500 text-2xl" />
                            </div>
                            <h3 className="font-semibold text-gray-800 mb-1">Always Changeable</h3>
                            <p className="text-sm text-gray-600">You can update these hours anytime from your profile</p>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start">
                            <FaInfoCircle className="text-amber-500 text-lg mr-3 mt-1 flex-shrink-0" />
                            <div className="text-left">
                                <p className="text-amber-800 font-semibold mb-2">
                                    This step is required to complete your registration
                                </p>
                                <ul className="text-amber-700 text-sm space-y-1">
                                    <li>• Set hours for at least one open day to continue</li>
                                    <li>• You can mark days as closed if you don't operate</li>
                                    <li>• Customers will see these hours when placing orders</li>
                                    <li>• You can always update them later from your profile section</li>
                                    <li>• These hours help coordinate pickup times with customers</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-2xl rounded-xl p-8 border border-gray-100">
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-800">Set Your Business Hours</h2>
                            <div className="text-sm text-gray-600">
                                {getOpenDaysCount()} of 7 days open
                            </div>
                        </div>
                        <p className="text-gray-600 mt-2">
                            Set hours for at least one day to continue. You can mark days as closed.
                        </p>

                        {/* Progress bar */}
                        <div className="mt-4">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progress</span>
                                <span>
                                    {Math.round((getOpenDaysCount() / 7) * 100)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${(getOpenDaysCount() / 7) * 100}%`
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-6">
                            {daysOfWeek.map((day, index) => (
                                <div key={day} className="border-b pb-6 last:border-b-0">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${businessHours[day].closed ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                            <h3 className="text-xl font-semibold text-gray-900 capitalize">
                                                {day}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <label className="flex items-center gap-2 text-sm text-gray-600">
                                                    <input
                                                        type="checkbox"
                                                        checked={businessHours[day].closed}
                                                        onChange={() => handleClosedToggle(day)}
                                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                    />
                                                    <span className="flex items-center gap-1">
                                                        <FaTimes className="text-red-500 text-xs" />
                                                        Closed
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                        {index === 0 && hasSetMondayHours && !businessHours.monday.closed && (
                                            <button
                                                type="button"
                                                onClick={handleSameForAll}
                                                className="flex items-center gap-2 text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md"
                                            >
                                                <FaCheckCircle className="text-sm" />
                                                Same for all days
                                            </button>
                                        )}
                                    </div>

                                    {!businessHours[day].closed ? (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Opening Time
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={businessHours[day].open}
                                                        onChange={(e) => handleTimeChange(day, "open", e.target.value)}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                                                        placeholder="Select opening time"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Closing Time
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={businessHours[day].close}
                                                        onChange={(e) => handleTimeChange(day, "close", e.target.value)}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                                                        placeholder="Select closing time"
                                                    />
                                                </div>
                                            </div>

                                            {businessHours[day].open && businessHours[day].close && (
                                                <div className={`mt-3 flex items-center text-sm p-3 rounded-lg ${validateTimeOrder(day)
                                                    ? "text-green-600 bg-green-50"
                                                    : "text-red-600 bg-red-50"
                                                    }`}>
                                                    {validateTimeOrder(day) ? (
                                                        <>
                                                            <FaCheckCircle className="mr-2" />
                                                            <span className="font-medium">
                                                                Open: {businessHours[day].open} - {businessHours[day].close}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaInfoCircle className="mr-2" />
                                                            <span className="font-medium">
                                                                Opening time must be before closing time
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {businessHours[day].open && !businessHours[day].close && (
                                                <div className="mt-3 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                                                    <FaInfoCircle className="inline mr-2" />
                                                    Please set the closing time for {day}
                                                </div>
                                            )}

                                            {!businessHours[day].open && businessHours[day].close && (
                                                <div className="mt-3 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                                                    <FaInfoCircle className="inline mr-2" />
                                                    Please set the opening time for {day}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                                            <FaTimes className="inline mr-2" />
                                            <span className="font-medium">
                                                Shop is closed on {day}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                type="submit"
                                disabled={loading || getOpenDaysCount() === 0}
                                className="flex-1 sm:flex-none bg-green-600 text-white px-12 py-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg shadow-lg"
                            >
                                {loading ? "Saving..." : "Continue to Dashboard"}
                            </button>
                        </div>

                        {getOpenDaysCount() === 0 && (
                            <div className="mt-4 text-center">
                                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                                    <FaInfoCircle className="inline mr-2" />
                                    <strong>At least one day must be open with business hours to continue.</strong> You can mark other days as closed.
                                </p>
                            </div>
                        )}
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600 mb-2">
                        <strong>Note:</strong> Business hours are required to help coordinate pickups with customers.
                    </p>
                    <p className="text-xs text-gray-500">
                        You can always update your business hours later from your profile settings.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BusinessHoursSetup;
