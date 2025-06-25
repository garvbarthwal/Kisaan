import React from 'react';
import { FaUpload, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';

/**
 * Upload Progress Component
 * Shows the current status of image upload with progress bar
 */
const UploadProgress = ({
    isUploading,
    progress,
    uploadComplete,
    uploadError,
    fileCount = 1,
    className = ""
}) => {
    if (!isUploading && !uploadComplete && !uploadError) {
        return null;
    }

    return (
        <div className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${className}`}>
            <div className="flex items-center space-x-3">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                    {uploadError ? (
                        <FaTimes className="text-red-500 text-lg" />
                    ) : uploadComplete ? (
                        <FaCheck className="text-green-500 text-lg" />
                    ) : (
                        <FaSpinner className="text-blue-500 text-lg animate-spin" />
                    )}
                </div>

                {/* Status Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">                        <p className="text-sm font-medium text-gray-900">
                        {uploadError ? (
                            "Upload Failed"
                        ) : uploadComplete ? (
                            fileCount > 0 ? `${fileCount} image${fileCount !== 1 ? 's' : ''} uploaded successfully` : "Images uploaded successfully"
                        ) : (
                            "Uploading..."
                        )}
                    </p>
                        {isUploading && (
                            <span className="text-sm text-gray-500">{progress}%</span>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {isUploading && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    )}

                    {/* Error Message */}
                    {uploadError && (
                        <p className="text-sm text-red-600 mt-1">{uploadError}</p>
                    )}

                    {/* Success Message */}
                    {uploadComplete && (
                        <p className="text-sm text-green-600 mt-1">
                            Images uploaded and ready to save
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadProgress;
