import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile } from "../redux/slices/authSlice";
import { updateFarmerProfile, getMyFarmerProfile, getAllFarmers, clearSuccessState } from "../redux/slices/farmerSlice";
import { getVerificationStatus } from "../redux/slices/verificationSlice";
import Loader from "../components/Loader";
import LocationDetector from "../components/LocationDetector";
import VerificationBadge from "../components/VerificationBadge";
import FarmerVerificationModal from "../components/FarmerVerificationModal";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaLeaf,
  FaCheck,
  FaUpload,
  FaTimes,
  FaCheckCircle,
  FaShieldAlt,
} from "react-icons/fa";
import UploadProgress from "../components/UploadProgress";
import { toast } from "react-toastify";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  const {
    myFarmerProfile,
    loading: farmerLoading,
    success: farmerSuccess,
  } = useSelector((state) => state.farmers);
  const { isVerified, loading: verificationLoading } = useSelector((state) => state.verification);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const [userForm, setUserForm] = useState({
    name: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });
  const [farmerForm, setFarmerForm] = useState({
    farmName: "",
    description: "",
    farmImages: [],
    farmImageFiles: [], // For storing new File objects to upload
    farmingPractices: [],
    establishedYear: "",
    socialMedia: {
      facebook: "",
      instagram: "",
      twitter: "",
    },
    businessHours: {
      monday: { open: "", close: "", closed: false },
      tuesday: { open: "", close: "", closed: false },
      wednesday: { open: "", close: "", closed: false },
      thursday: { open: "", close: "", closed: false },
      friday: { open: "", close: "", closed: false },
      saturday: { open: "", close: "", closed: false },
      sunday: { open: "", close: "", closed: false },
    },
  });
  const [farmingPractice, setFarmingPractice] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [farmImagePreviewUrls, setFarmImagePreviewUrls] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  // Upload progress states for farm images
  const [farmImageUploadState, setFarmImageUploadState] = useState({
    isUploading: false,
    progress: 0,
    uploadComplete: false,
    uploadError: null,
    fileCount: 0
  });
  // Location change states
  const [isLocationChangeMode, setIsLocationChangeMode] = useState(false);
  const [hasAddressChanged, setHasAddressChanged] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  // Business hours state
  const [hasSetMondayHours, setHasSetMondayHours] = useState(false);

  useEffect(() => {
    if (user) {
      setUserForm({
        name: user.name || "",
        phone: user.phone || "",
        address: {
          street: user.address?.street || "",
          city: user.address?.city || "",
          state: user.address?.state || "",
          zipCode: user.address?.zipCode || "",
        },
      });
    }
  }, [user]);

  // Fetch farmer profile when component loads
  useEffect(() => {
    if (user?.role === "farmer") {
      dispatch(getMyFarmerProfile());
      dispatch(getVerificationStatus());
    }
  }, [dispatch, user?.role]);

  useEffect(() => {
    if (user?.role === "farmer" && myFarmerProfile) {
      setFarmerForm({
        farmName: myFarmerProfile.farmName || "",
        description: myFarmerProfile.description || "",
        farmImages: myFarmerProfile.farmImages || [],
        farmImageFiles: [], // Initialize as empty array for new uploads
        farmingPractices: myFarmerProfile.farmingPractices || [],
        establishedYear: myFarmerProfile.establishedYear || "",
        socialMedia: {
          facebook: myFarmerProfile.socialMedia?.facebook || "",
          instagram: myFarmerProfile.socialMedia?.instagram || "",
          twitter: myFarmerProfile.socialMedia?.twitter || "",
        },
        businessHours: {
          monday: myFarmerProfile.businessHours?.monday || {
            open: "",
            close: "",
            closed: false,
          },
          tuesday: myFarmerProfile.businessHours?.tuesday || {
            open: "",
            close: "",
            closed: false,
          },
          wednesday: myFarmerProfile.businessHours?.wednesday || {
            open: "",
            close: "",
            closed: false,
          },
          thursday: myFarmerProfile.businessHours?.thursday || {
            open: "",
            close: "",
            closed: false,
          },
          friday: myFarmerProfile.businessHours?.friday || {
            open: "",
            close: "",
            closed: false,
          },
          saturday: myFarmerProfile.businessHours?.saturday || {
            open: "",
            close: "",
            closed: false,
          },
          sunday: myFarmerProfile.businessHours?.sunday || {
            open: "",
            close: "",
            closed: false,
          },
        },
      });
      // Set preview URLs to existing farm images
      setFarmImagePreviewUrls(myFarmerProfile.farmImages || []);
    }
  }, [user, myFarmerProfile]);

  // Check Monday hours status when business hours change
  useEffect(() => {
    if (farmerForm.businessHours.monday) {
      const mondayHours = farmerForm.businessHours.monday;
      if (!mondayHours.closed && mondayHours.open && mondayHours.close) {
        setHasSetMondayHours(true);
      } else {
        setHasSetMondayHours(false);
      }
    }
  }, [farmerForm.businessHours.monday]);

  // Clear success state after some time
  useEffect(() => {
    if (farmerSuccess) {
      const timer = setTimeout(() => {
        dispatch(clearSuccessState());
      }, 5000); // Clear after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [farmerSuccess, dispatch]);

  const handleUserChange = (e) => {
    const { name, value } = e.target;

    // Prevent phone number changes
    if (name === "phone") {
      return;
    }

    // Check if address fields are being changed
    if (name.includes("address.") && (name.includes("street") || name.includes("city") || name.includes("state") || name.includes("zipCode"))) {
      setHasAddressChanged(true);
      setShowLocationPrompt(true);
      // Hide prompt after 5 seconds
      setTimeout(() => setShowLocationPrompt(false), 5000);
    }

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setUserForm({
        ...userForm,
        [parent]: {
          ...userForm[parent],
          [child]: value,
        },
      });
    } else {
      setUserForm({
        ...userForm,
        [name]: value,
      });
    }
  };

  const handleFarmerChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFarmerForm({
        ...farmerForm,
        [name]: checked,
      });
      return;
    }

    if (name.includes(".")) {
      const [parent, child, grandchild] = name.split(".");

      if (grandchild) {
        setFarmerForm({
          ...farmerForm,
          [parent]: {
            ...farmerForm[parent],
            [child]: {
              ...farmerForm[parent][child],
              [grandchild]: value,
            },
          },
        });
      } else {
        setFarmerForm({
          ...farmerForm,
          [parent]: {
            ...farmerForm[parent],
            [child]: value,
          },
        });
      }

      // Check if this is Monday business hours and update status
      if (parent === "businessHours" && child === "monday") {
        const updatedMondayHours = {
          ...farmerForm.businessHours.monday,
          [grandchild]: value
        };
        if (!updatedMondayHours.closed && updatedMondayHours.open && updatedMondayHours.close) {
          setHasSetMondayHours(true);
        } else {
          setHasSetMondayHours(false);
        }
      }
    } else {
      setFarmerForm({
        ...farmerForm,
        [name]: value,
      });
    }
  };

  const handleAddFarmingPractice = () => {
    if (farmingPractice.trim() !== "") {
      setFarmerForm({
        ...farmerForm,
        farmingPractices: [
          ...farmerForm.farmingPractices,
          farmingPractice.trim(),
        ],
      });
      setFarmingPractice("");
    }
  };
  const handleRemoveFarmingPractice = (index) => {
    setFarmerForm({
      ...farmerForm,
      farmingPractices: farmerForm.farmingPractices.filter(
        (_, i) => i !== index
      ),
    });
  };

  const handleSameForAllBusinessHours = () => {
    const mondayHours = farmerForm.businessHours.monday;
    if (!mondayHours.closed && mondayHours.open && mondayHours.close) {
      const updatedBusinessHours = {};
      const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

      daysOfWeek.forEach(day => {
        updatedBusinessHours[day] = { ...mondayHours };
      });

      setFarmerForm({
        ...farmerForm,
        businessHours: updatedBusinessHours,
      });
      toast.success("Monday hours applied to all days!");
    } else {
      toast.error("Please set both opening and closing times for Monday first!");
    }
  };

  const handleFarmImageChange = async (e) => {
    const files = Array.from(e.target.files);
    await processNewFarmImages(files);
  };

  const processNewFarmImages = async (files) => {
    if (files.length === 0) return;

    try {      // Import the upload utility
      const { uploadProductImages, validateImages } = await import('../utils/imageUpload');

      // Validate images before attempting to upload
      const validation = validateImages(files);
      if (!validation.valid) {
        // Handle validation error - you might want to add error state for farm images
        setFarmImageUploadState(prev => ({
          ...prev,
          uploadError: validation.errors.join(', ')
        }));
        return;
      }      // Set upload state
      setFarmImageUploadState(prev => ({
        ...prev,
        isUploading: true,
        progress: 0,
        uploadError: null,
        fileCount: files.length
      }));      // Upload images immediately to Cloudinary
      const imageUrls = await uploadProductImages(files, {
        validate: false, // Already validated
        onUploadStart: () => {
          setFarmImageUploadState(prev => ({
            ...prev,
            isUploading: true,
            progress: 0,
            uploadError: null,
            fileCount: files.length
          }));
        },
        onProgress: (progress) => {
          setFarmImageUploadState(prev => ({
            ...prev,
            progress
          }));
        },
        onUploadComplete: () => {
          setFarmImageUploadState(prev => ({
            ...prev,
            isUploading: false,
            uploadComplete: true
          }));
        }
      });

      // Validate that we received valid Cloudinary URLs
      const validImageUrls = imageUrls.filter(url =>
        typeof url === 'string' &&
        (url.startsWith('http://') || url.startsWith('https://')) &&
        !url.startsWith('blob:')
      );

      if (validImageUrls.length === 0) {
        throw new Error('No valid image URLs received from upload');
      }

      // Update state with validated Cloudinary URLs only (combine with existing images)
      const newImages = [...(farmerForm.farmImages || []), ...validImageUrls];
      setFarmImagePreviewUrls([...farmImagePreviewUrls, ...validImageUrls]);
      setFarmerForm({
        ...farmerForm,
        farmImages: newImages,
      });

    } catch (error) {
      setFarmImageUploadState(prev => ({
        ...prev,
        isUploading: false,
        uploadError: error.message || 'Failed to upload images. Please try again.'
      }));
      console.error('Farm image upload failed:', error);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!farmImageUploadState.isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (farmImageUploadState.isUploading) return;

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      processNewFarmImages(files);
    }
  };

  const removeFarmImage = (index) => {
    const newImagePreviewUrls = [...farmImagePreviewUrls];
    const existingImagesCount = farmerForm.farmImages ? farmerForm.farmImages.length : 0;

    // Remove the preview URL
    newImagePreviewUrls.splice(index, 1);
    setFarmImagePreviewUrls(newImagePreviewUrls);

    if (index < existingImagesCount) {
      // Removing an existing image (from Cloudinary)
      const newImages = [...farmerForm.farmImages];
      newImages.splice(index, 1);
      setFarmerForm({
        ...farmerForm,
        farmImages: newImages,
      });
    } else {
      // Removing a newly uploaded file
      const newFileIndex = index - existingImagesCount;
      const newImageFiles = [...(farmerForm.farmImageFiles || [])];
      newImageFiles.splice(newFileIndex, 1);
      setFarmerForm({
        ...farmerForm,
        farmImageFiles: newImageFiles,
      });
    }
  };

  const handleUserSubmit = (e) => {
    e.preventDefault();
    // Exclude phone number from update request
    const { phone, ...updateData } = userForm;
    dispatch(updateProfile(updateData));
  };
  const handleFarmerSubmit = async (e) => {
    e.preventDefault();

    try {
      let updatedFarmerForm = { ...farmerForm };

      // If we have new farm image files to upload
      if (farmerForm.farmImageFiles && farmerForm.farmImageFiles.length > 0) {
        // Import the upload utility dynamically
        const { uploadFarmImages, validateImages } = await import('../utils/imageUpload');

        // Validate images before attempting to upload
        const validation = validateImages(farmerForm.farmImageFiles, {
          maxSize: 5 * 1024 * 1024, // 5MB for farm images
          maxCount: 10 // Allow up to 10 farm images
        });
        if (!validation.valid) {
          setFarmImageUploadState(prev => ({
            ...prev,
            uploadError: validation.errors[0]
          }));
          return;
        }

        // Upload new farm images to Cloudinary with progress tracking
        const newFarmImageUrls = await uploadFarmImages(farmerForm.farmImageFiles, {
          validate: false,
          onUploadStart: () => {
            setFarmImageUploadState(prev => ({
              ...prev,
              isUploading: true,
              progress: 0,
              uploadError: null
            }));
          },
          onProgress: (progress) => {
            setFarmImageUploadState(prev => ({
              ...prev,
              progress
            }));
          },
          onUploadComplete: () => {
            setFarmImageUploadState(prev => ({
              ...prev,
              isUploading: false,
              uploadComplete: true
            }));
          }
        });

        // Combine existing Cloudinary images with new ones
        updatedFarmerForm = {
          ...farmerForm,
          farmImages: [...farmerForm.farmImages.filter(img => img.startsWith('http')), ...newFarmImageUrls]
        };

        // Remove temporary fields
        delete updatedFarmerForm.farmImageFiles;
      }      // Update the farmer profile
      const result = await dispatch(updateFarmerProfile(updatedFarmerForm));

      if (result.type === 'farmers/updateFarmerProfile/fulfilled') {
        // Refresh the farmers list so other users see the updated profile
        dispatch(getAllFarmers());

        // Refresh own profile to ensure consistency
        dispatch(getMyFarmerProfile());

        // Clear any new image files since they've been uploaded
        setFarmerForm(prev => ({
          ...prev,
          farmImageFiles: []
        }));

        // Reset upload state
        setFarmImageUploadState({
          isUploading: false,
          progress: 0,
          uploadComplete: false,
          uploadError: null
        });
      }
    } catch (error) {
      setFarmImageUploadState(prev => ({
        ...prev,
        isUploading: false,
        uploadError: error.message || 'Failed to upload farm images. Please try again.'
      }));
    }
  };

  // Handle location detection for user address
  const handleLocationDetected = (locationData) => {
    setUserForm(prev => ({
      ...prev,
      address: {
        ...prev.address,
        // Only update city, state, and zipCode - keep street as is
        city: locationData.city,
        state: locationData.state,
        zipCode: locationData.zipCode,
        coordinates: locationData.coordinates,
        locationDetected: locationData.locationDetected,
      }
    }));
    setHasAddressChanged(false);
    setShowLocationPrompt(false);
  };

  // Handle change location button click
  const handleChangeLocation = () => {
    setIsLocationChangeMode(true);
  };

  // Handle cancel location change
  const handleCancelLocationChange = () => {
    setIsLocationChangeMode(false);
    setHasAddressChanged(false);
    setShowLocationPrompt(false);
  };

  // Handle farm location detection for farmers
  const handleFarmLocationDetected = (locationData) => {
    // Since we're removing farm location, we can remove this function
    // or keep it empty for now
  };

  if (loading || farmerLoading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <div className="flex border-b border-gray-200 mb-8">
        <button
          className={`py-2 px-4 font-medium ${activeTab === "general"
            ? "text-green-500 border-b-2 border-green-500"
            : "text-gray-500"
            }`}
          onClick={() => setActiveTab("general")}
        >
          {"General Information"}
        </button>
        {user?.role === "farmer" && (
          <>
            <button
              className={`py-2 px-4 font-medium ${activeTab === "farm"
                ? "text-green-500 border-b-2 border-green-500"
                : "text-gray-500"
                }`}
              onClick={() => setActiveTab("farm")}
            >
              {"Farm Profile"}
            </button>
            <button
              className={`py-2 px-4 font-medium ${activeTab === "verification"
                ? "text-green-500 border-b-2 border-green-500"
                : "text-gray-500"
                }`}
              onClick={() => setActiveTab("verification")}
            >
              {"Verification"}
            </button>
          </>
        )}
      </div>

      {activeTab === "general" && (
        <div className="glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">General Information</h2>
            {user?.role === "farmer" && (
              <VerificationBadge
                isVerified={isVerified}
                size="md"
                style="badge"
                showText={true}
              />
            )}
          </div>

          <form onSubmit={handleUserSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={userForm.name}
                    onChange={handleUserChange}
                    className="form-input pl-10 block w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={user?.email}
                    className="form-input pl-10 bg-gray-100 block w-full"
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={userForm.phone}
                    className="form-input pl-10 block w-full bg-gray-100"
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Phone number cannot be changed
                </p>
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Account Type
                </label>
                <input
                  type="text"
                  id="role"
                  value={
                    user?.role.charAt(0).toUpperCase() + user?.role.slice(1)
                  }
                  className="form-input bg-gray-100 pl-3"
                  disabled
                />
              </div>
            </div>

            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <h3 className="text-lg font-medium">Address & Location</h3>
                <div className="flex items-center gap-2">
                  {!isLocationChangeMode && (
                    <button
                      type="button"
                      onClick={handleChangeLocation}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      <FaMapMarkerAlt className="text-xs" />
                      Change Location
                    </button>
                  )}
                  {isLocationChangeMode && (
                    <div className="flex items-center gap-2">
                      <LocationDetector
                        onLocationDetected={handleLocationDetected}
                        isLoading={loading}
                        variant="compact"
                      />
                      <button
                        type="button"
                        onClick={handleCancelLocationChange}
                        className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {showLocationPrompt && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 text-yellow-600 mt-0.5">💡</div>
                    <div>
                      <p className="text-sm text-yellow-800 font-medium">
                        Location Detection Recommended
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        For accurate delivery, we recommend using the "Detect Location" button to automatically fill your city, state, and PIN code.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {userForm.address.coordinates && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm text-green-700 font-medium">
                      ✓ Exact location detected and saved
                    </p>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Your precise coordinates have been saved for accurate delivery.
                    The exact coordinates are securely stored and not visible to others.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="address.street"
                    value={userForm.address.street}
                    onChange={handleUserChange}
                    className="form-input pl-10 block w-full"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="address.city"
                    value={userForm.address.city}
                    onChange={handleUserChange}
                    className="form-input block w-full pl-3"
                    placeholder="City"
                    disabled={!isLocationChangeMode}
                    required
                  />
                  <input
                    type="text"
                    name="address.state"
                    value={userForm.address.state}
                    onChange={handleUserChange}
                    className="form-input block w-full pl-3"
                    placeholder="State"
                    disabled={!isLocationChangeMode}
                    required
                  />
                </div>

                <input
                  type="text"
                  name="address.zipCode"
                  value={userForm.address.zipCode}
                  onChange={handleUserChange}
                  className="form-input block w-full pl-3"
                  placeholder="ZIP / Postal code"
                  disabled={!isLocationChangeMode}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {activeTab === "farm" && user?.role === "farmer" && (
        <div className="space-y-6">
          {/* Verification Prompt */}
          {!isVerified && !verificationLoading && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaShieldAlt className="text-blue-600 text-xl" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    Complete Your Verification
                  </h3>
                  <p className="text-blue-700 mb-4">
                    Get verified to build trust with consumers and unlock premium features.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setShowVerificationModal(true)}
                      className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                      <FaShieldAlt />
                      Get Verified Now
                    </button>
                    <button
                      onClick={() => setActiveTab("verification")}
                      className="inline-flex items-center gap-2 text-blue-700 border border-blue-300 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <FaCheckCircle />
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-6">Farm Profile</h2>

            <form onSubmit={handleFarmerSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label
                    htmlFor="farmName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Farm Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLeaf className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="farmName"
                      name="farmName"
                      value={farmerForm.farmName}
                      onChange={handleFarmerChange}
                      className="form-input pl-10 block w-full"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="establishedYear"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Established Year
                  </label>
                  <input
                    type="number"
                    id="establishedYear"
                    name="establishedYear"
                    value={farmerForm.establishedYear}
                    onChange={handleFarmerChange}
                    className="form-input block w-full"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>            <div className="mb-6">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Farm Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="4"
                  value={farmerForm.description}
                  onChange={handleFarmerChange}
                  className="form-input block w-full pl-3"
                  placeholder="Tell customers about your farm..."
                  required
                ></textarea>
              </div>

              {/* Farm Images Upload Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Farm Images
                </label>              <div className="flex flex-col space-y-3">
                  {/* Upload Area with Drag & Drop */}
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${isDragOver
                      ? 'border-green-500 bg-green-50'
                      : farmImageUploadState.isUploading
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                      }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="text-center">
                      <div className="flex justify-center mb-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDragOver ? 'bg-green-200' : 'bg-green-100'
                          }`}>
                          <FaUpload className={`text-xl transition-colors ${isDragOver ? 'text-green-600' : 'text-green-500'
                            }`} />
                        </div>
                      </div>
                      <label className="cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {isDragOver
                              ? 'Drop your farm images here'
                              : 'Drag & drop farm images or click to browse'
                            }
                          </p>
                          <p className="text-xs text-gray-500 mb-3">
                            PNG, JPG, WebP up to 5MB each (Max 10 images)
                          </p>
                          <span className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${farmImageUploadState.isUploading
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : isDragOver
                              ? 'bg-green-700 text-white'
                              : 'bg-green-600 text-white hover:bg-green-700'
                            }`}>
                            {farmImageUploadState.isUploading ? 'Uploading...' : 'Choose Images'}
                          </span>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFarmImageChange}
                          className="hidden"
                          disabled={farmImageUploadState.isUploading}
                        />
                      </label>
                    </div>
                  </div>
                </div>              {/* Upload Progress Component */}
                <UploadProgress
                  isUploading={farmImageUploadState.isUploading}
                  progress={farmImageUploadState.progress}
                  uploadComplete={farmImageUploadState.uploadComplete}
                  uploadError={farmImageUploadState.uploadError}
                  fileCount={farmImageUploadState.fileCount}
                  className="mt-4"
                />{/* Image Preview Grid */}
                {farmImagePreviewUrls.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Farm Images ({farmImagePreviewUrls.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {farmImagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
                            <img
                              src={url || "/placeholder.svg"}
                              alt={`Farm image ${index + 1}`}
                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/placeholder.svg";
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFarmImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg transform hover:scale-110"
                            disabled={farmImageUploadState.isUploading}
                            title="Remove image"
                          >
                            <FaTimes className="w-3 h-3" />
                          </button>
                          {/* Image index indicator */}
                          <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>                  <p className="text-xs text-gray-500 mt-2">
                      Drag and drop images or click to browse. Images will be optimized automatically for best performance.
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Farming Practices
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={farmingPractice}
                    onChange={(e) => setFarmingPractice(e.target.value)}
                    className="form-input flex-grow pl-3"
                    placeholder="e.g., Organic, No-till, Permaculture"
                  />
                  <button
                    type="button"
                    onClick={handleAddFarmingPractice}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {farmerForm.farmingPractices.map((practice, index) => (
                    <div
                      key={index}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center"
                    >
                      <span>{practice}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFarmingPractice(index)}
                        className="ml-2 text-green-800 hover:text-green-900"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Social Media</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="facebook"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Facebook
                    </label>
                    <input
                      type="url"
                      id="facebook"
                      name="socialMedia.facebook"
                      value={farmerForm.socialMedia.facebook}
                      onChange={handleFarmerChange}
                      className="form-input block w-full pl-3"
                      placeholder="https://facebook.com/yourfarm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="instagram"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Instagram
                    </label>
                    <input
                      type="url"
                      id="instagram"
                      name="socialMedia.instagram"
                      value={farmerForm.socialMedia.instagram}
                      onChange={handleFarmerChange}
                      className="form-input block w-full pl-3"
                      placeholder="https://instagram.com/yourfarm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="twitter"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Twitter
                    </label>
                    <input
                      type="url"
                      id="twitter"
                      name="socialMedia.twitter"
                      value={farmerForm.socialMedia.twitter}
                      onChange={handleFarmerChange}
                      className="form-input block w-full pl-3"
                      placeholder="https://twitter.com/yourfarm"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Business Hours</h3>
                  {hasSetMondayHours && (
                    <button
                      type="button"
                      onClick={handleSameForAllBusinessHours}
                      className="flex items-center gap-2 text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md"
                    >
                      <FaCheckCircle className="text-sm" />
                      Apply Monday to all days
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(farmerForm.businessHours).map(
                    ([day, hours]) => (
                      <div
                        key={day}
                        className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${hours.closed ? 'bg-red-500' : 'bg-green-500'}`}></div>
                          <span className="capitalize font-medium">{day}</span>
                          {day === "monday" && hasSetMondayHours && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Reference
                            </span>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Opening Time</label>
                          <input
                            type="time"
                            name={`businessHours.${day}.open`}
                            value={hours.open}
                            onChange={handleFarmerChange}
                            className="form-input text-sm"
                            disabled={hours.closed}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Closing Time</label>
                          <input
                            type="time"
                            name={`businessHours.${day}.close`}
                            value={hours.close}
                            onChange={handleFarmerChange}
                            className="form-input text-sm"
                            disabled={hours.closed}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input
                              type="checkbox"
                              checked={hours.closed}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                setFarmerForm({
                                  ...farmerForm,
                                  businessHours: {
                                    ...farmerForm.businessHours,
                                    [day]: {
                                      ...hours,
                                      closed: isChecked,
                                      open: isChecked ? "" : hours.open,
                                      close: isChecked ? "" : hours.close,
                                    },
                                  },
                                });
                              }}
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <span className="flex items-center gap-1">
                              <FaTimes className="text-red-500 text-xs" />
                              Closed
                            </span>
                          </label>
                          {hours.open && hours.close && !hours.closed && (
                            <div className="text-xs text-green-600 font-medium">
                              {hours.open} - {hours.close}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={farmerLoading || farmImageUploadState.isUploading}
              >
                {farmImageUploadState.isUploading
                  ? `Uploading... ${farmImageUploadState.progress}%`
                  : farmerLoading
                    ? "Saving..."
                    : "Save Farm Profile"
                }
              </button>

              {farmerSuccess && (
                <div className="mt-4 flex items-center text-green-600">
                  <FaCheck className="mr-2" />
                  <span>Farm profile updated successfully!</span>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {activeTab === "verification" && user?.role === "farmer" && (
        <div className="glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Farmer Verification</h2>
            <VerificationBadge
              isVerified={isVerified}
              size="md"
              style="badge"
              showText={true}
            />
          </div>

          {isVerified ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <FaCheckCircle className="text-green-500 text-3xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Verification Complete!
              </h3>
              <p className="text-gray-600 mb-6">
                Your farmer account has been verified. Consumers will see a verification badge on your profile and products.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">Benefits of Verification:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Enhanced trust with consumers</li>
                  <li>• Priority in search results</li>
                  <li>• Access to premium features</li>
                  <li>• Higher conversion rates</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                  <FaShieldAlt className="text-gray-400 text-3xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Get Verified Now
                </h3>
                <p className="text-gray-600 mb-6">
                  Verify your farmer account to build trust with consumers and unlock premium features.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-medium text-blue-800 mb-3">Verification Process:</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-medium">1</span>
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Government Data Verification</p>
                      <p>Enter your Aadhar-linked mobile number and last 4 digits of Aadhar</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-medium">2</span>
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Instant Verification</p>
                      <p>If found in government records, you'll be verified instantly</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-medium">3</span>
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Manual Verification (if needed)</p>
                      <p>Upload documents for manual review if automatic verification fails</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setShowVerificationModal(true)}
                  className="btn btn-primary inline-flex items-center gap-2"
                >
                  <FaShieldAlt />
                  Start Verification Process
                </button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Why Verify?</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Build consumer trust with verified badge</li>
                  <li>• Higher visibility in search results</li>
                  <li>• Access to premium seller tools</li>
                  <li>• Better conversion rates on listings</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Verification Modal */}
      <FarmerVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onVerificationSuccess={() => {
          setShowVerificationModal(false);
          dispatch(getVerificationStatus());
          dispatch(getMyFarmerProfile());
        }}
      />
    </div>
  );
};

export default ProfilePage;
