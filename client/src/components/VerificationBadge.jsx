import React from 'react';
import { FaCheckCircle, FaShieldAlt } from 'react-icons/fa';

const VerificationBadge = ({
    isVerified,
    size = 'sm',
    showText = false,
    className = '',
    style = 'icon' // 'icon', 'badge', 'full'
}) => {
    const sizeClasses = {
        xs: 'text-xs',
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl'
    };

    const iconSizes = {
        xs: 'text-xs',
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl'
    };

    if (!isVerified) {
        if (style === 'full' || showText) {
            return (
                <span className={`inline-flex items-center gap-1 text-gray-500 ${sizeClasses[size]} ${className}`}>
                    <FaShieldAlt className={`${iconSizes[size]} text-gray-400`} />
                    {showText && <span>Unverified</span>}
                </span>
            );
        }
        return null;
    }

    if (style === 'badge') {
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full ${sizeClasses[size]} ${className}`}>
                <FaCheckCircle className={iconSizes[size]} />
                {showText && <span>Verified</span>}
            </span>
        );
    }

    if (style === 'full') {
        return (
            <span className={`inline-flex items-center gap-1 text-black ${sizeClasses[size]} ${className}`}>
                <FaCheckCircle className={`${iconSizes[size]} text-black`} />
                {showText && <span>Verified Farmer</span>}
            </span>
        );
    }

    // Default icon style
    return (
        <FaCheckCircle
            className={`${iconSizes[size]} text-green-500 ${className}`}
            title="Verified Farmer"
        />
    );
};

export default VerificationBadge;
