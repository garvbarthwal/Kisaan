import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    initializeAddressFromUser,
    createEmptyAddress,
    updateAddressWithLocation,
    getDefaultOrderDateTime
} from '../utils/addressUtils';

/**
 * Custom hook for managing checkout page state
 * Centralizes all checkout-related state management and business logic
 */
export const useCheckoutState = () => {
    const [orderType, setOrderType] = useState("");
    const [isAddressChangeMode, setIsAddressChangeMode] = useState(false);
    const [addressDetectedInCheckout, setAddressDetectedInCheckout] = useState(false);
    const [availableFulfillmentOptions, setAvailableFulfillmentOptions] = useState({
        delivery: false,
        pickup: false,
        pickupHours: null
    });

    const { user } = useSelector((state) => state.auth);
    const { cartItems } = useSelector((state) => state.cart);

    const defaultDateTime = getDefaultOrderDateTime();

    const [orderDetails, setOrderDetails] = useState({
        pickupDetails: {
            date: "", // Initially empty, user must select a date
            time: "", // Initially empty, user must select a time slot
            location: "Farmer's Location",
        },
        deliveryDetails: {
            address: createEmptyAddress(),
            date: defaultDateTime.date,
            time: defaultDateTime.time,
        },
        paymentMethod: "cash",
        notes: "",
    });

    // Initialize delivery address when user data is available
    useEffect(() => {
        if (user) {
            setOrderDetails((prev) => ({
                ...prev,
                deliveryDetails: {
                    ...prev.deliveryDetails,
                    address: initializeAddressFromUser(user),
                },
            }));
        }
    }, [user]);

    // Check available fulfillment options from cart items
    useEffect(() => {
        if (cartItems.length > 0) {
            // Initialize with restrictive defaults
            let options = {
                delivery: false,
                pickup: false,
                pickupHours: null,
                needsBusinessHours: false // Flag to indicate if we need farmer's business hours
            };

            // Get all products with fulfillment options
            const productsWithOptions = cartItems.filter(item => item.product?.fulfillmentOptions);

            if (productsWithOptions.length > 0) {
                // Only enable options available to ALL items in cart
                options.delivery = cartItems.every(item =>
                    item.product?.fulfillmentOptions?.delivery || false
                );
                options.pickup = cartItems.every(item =>
                    item.product?.fulfillmentOptions?.pickup || false
                );

                // Handle pickup hours aggregation if pickup is enabled
                if (options.pickup) {
                    const pickupEnabledItems = cartItems.filter(item =>
                        item.product?.fulfillmentOptions?.pickup
                    );

                    // Check if all products have the same pickup hours approach
                    const hasCustomHours = pickupEnabledItems.filter(item => item.product?.pickupHours);
                    const usesBusinessHours = pickupEnabledItems.filter(item => !item.product?.pickupHours);

                    if (hasCustomHours.length === pickupEnabledItems.length) {
                        // All products have custom pickup hours - use the first one since they're from same farmer
                        options.pickupHours = hasCustomHours[0].product.pickupHours;
                        options.needsBusinessHours = false;
                    } else if (usesBusinessHours.length === pickupEnabledItems.length) {
                        // All products use business hours
                        options.pickupHours = null;
                        options.needsBusinessHours = true;
                    } else {
                        // Mixed scenario: some products have custom hours, others use business hours
                        // For safety, fall back to business hours approach
                        options.pickupHours = null;
                        options.needsBusinessHours = true;
                    }
                }
            } else {
                // Fallback for products without fulfillment options configured
                options.delivery = true;
                options.pickup = true;
                options.needsBusinessHours = true;
            }

            setAvailableFulfillmentOptions(options);

            // Set default order type to the first available option (but don't auto-select date)
            if (!orderType) {
                if (options.pickup) {
                    setOrderType("pickup");
                } else if (options.delivery) {
                    setOrderType("delivery");
                }
            }
        }
    }, [cartItems, orderType]);

    // Location detection handler
    const handleLocationDetected = (locationData) => {
        setOrderDetails(prev => ({
            ...prev,
            deliveryDetails: {
                ...prev.deliveryDetails,
                address: updateAddressWithLocation(prev.deliveryDetails.address, locationData)
            }
        }));

        // Only show success message when location is detected during address change mode
        if (isAddressChangeMode) {
            setAddressDetectedInCheckout(true);
        }
    };

    // Address change handlers
    const handleChangeAddress = () => {
        setIsAddressChangeMode(true);
        setAddressDetectedInCheckout(false);
    };

    const handleCancelAddressChange = () => {
        setIsAddressChangeMode(false);
        setAddressDetectedInCheckout(false);

        // Reset to user's original address
        setOrderDetails(prev => ({
            ...prev,
            deliveryDetails: {
                ...prev.deliveryDetails,
                address: initializeAddressFromUser(user),
            },
        }));
    };

    // Generic input change handler
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name.includes(".")) {
            const [parent, child, grandchild] = name.split(".");

            if (grandchild) {
                setOrderDetails(prev => ({
                    ...prev,
                    [parent]: {
                        ...prev[parent],
                        [child]: {
                            ...prev[parent][child],
                            [grandchild]: value,
                        },
                    },
                }));
            } else {
                setOrderDetails(prev => ({
                    ...prev,
                    [parent]: {
                        ...prev[parent],
                        [child]: value,
                    },
                }));
            }
        } else {
            setOrderDetails(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    // Handler for pickup date change that clears time
    const handlePickupDateChange = (e) => {
        const newDate = e.target.value;
        setOrderDetails(prev => ({
            ...prev,
            pickupDetails: {
                ...prev.pickupDetails,
                date: newDate,
                time: "" // Clear time when date changes
            }
        }));
    };

    return {
        // State
        orderType,
        setOrderType,
        isAddressChangeMode,
        addressDetectedInCheckout,
        availableFulfillmentOptions,
        orderDetails,
        setOrderDetails,

        // Handlers
        handleLocationDetected,
        handleChangeAddress,
        handleCancelAddressChange,
        handleInputChange,
        handlePickupDateChange, // Add new handler
    };
};
