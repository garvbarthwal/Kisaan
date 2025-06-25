import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile } from "../redux/slices/authSlice";
import { updateFarmerProfile, getMyFarmerProfile, getAllFarmers, clearSuccessState } from "../redux/slices/farmerSlice";
import Loader from "../components/Loader";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaLeaf,
  FaCheck,
  FaUpload,
  FaTimes,
} from "react-icons/fa";
import UploadProgress from "../components/UploadProgress";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  const {
    myFarmerProfile,
    loading: farmerLoading,
    success: farmerSuccess,
  } = useSelector((state) => state.farmers);

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
      monday: { open: "", close: "" },
      tuesday: { open: "", close: "" },
      wednesday: { open: "", close: "" },
      thursday: { open: "", close: "" },
      friday: { open: "", close: "" },
      saturday: { open: "", close: "" },
      sunday: { open: "", close: "" },
    },
    acceptsPickup: false,
    acceptsDelivery: false,
    deliveryRadius: 0,
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
          },
          tuesday: myFarmerProfile.businessHours?.tuesday || {
            open: "",
            close: "",
          },
          wednesday: myFarmerProfile.businessHours?.wednesday || {
            open: "",
            close: "",
          },
          thursday: myFarmerProfile.businessHours?.thursday || {
            open: "",
            close: "",
          },
          friday: myFarmerProfile.businessHours?.friday || {
            open: "",
            close: "",
          },
          saturday: myFarmerProfile.businessHours?.saturday || {
            open: "",
            close: "",
          },
          sunday: myFarmerProfile.businessHours?.sunday || {
            open: "",
            close: "",
          },
        }, acceptsPickup: myFarmerProfile.acceptsPickup || false,
        acceptsDelivery: myFarmerProfile.acceptsDelivery || false,
        deliveryRadius: myFarmerProfile.deliveryRadius || 0,
      });
      // Set preview URLs to existing farm images
      setFarmImagePreviewUrls(myFarmerProfile.farmImages || []);
    }
  }, [user, myFarmerProfile]);

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
  }; const handleFarmImageChange = async (e) => {
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
        console.error('Farm image validation failed:', validation.errors);
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
    dispatch(updateProfile(userForm));
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
          <button
            className={`py-2 px-4 font-medium ${activeTab === "farm"
              ? "text-green-500 border-b-2 border-green-500"
              : "text-gray-500"
              }`}
            onClick={() => setActiveTab("farm")}
          >
            {"Farm Profile"}
          </button>
        )}
      </div>

      {activeTab === "general" && (
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-6">General Information</h2>

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
                    onChange={handleUserChange}
                    className="form-input pl-10 block w-full"
                  />
                </div>
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
              <h3 className="text-lg font-medium mb-3">Address</h3>
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
                  />
                  <input
                    type="text"
                    name="address.state"
                    value={userForm.address.state}
                    onChange={handleUserChange}
                    className="form-input block w-full pl-3"
                    placeholder="State"
                  />
                </div>

                <input
                  type="text"
                  name="address.zipCode"
                  value={userForm.address.zipCode}
                  onChange={handleUserChange}
                  className="form-input block w-full pl-3"
                  placeholder="ZIP / Postal code"
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
            </div>            {/* Farm Images Upload Section */}
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
              <h3 className="text-lg font-medium mb-3">Business Hours</h3>
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(farmerForm.businessHours).map(
                  ([day, hours]) => (
                    <div
                      key={day}
                      className="grid grid-cols-3 gap-4 items-center"
                    >
                      <div className="capitalize">{day}</div>
                      <div>
                        <input
                          type="time"
                          name={`businessHours.${day}.open`}
                          value={hours.open}
                          onChange={handleFarmerChange}
                          className="form-input"
                        />
                      </div>
                      <div>
                        <input
                          type="time"
                          name={`businessHours.${day}.close`}
                          value={hours.close}
                          onChange={handleFarmerChange}
                          className="form-input"
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Order Options</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="acceptsPickup"
                    name="acceptsPickup"
                    checked={farmerForm.acceptsPickup}
                    onChange={handleFarmerChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="acceptsPickup"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Accepts Pickup Orders
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="acceptsDelivery"
                    name="acceptsDelivery"
                    checked={farmerForm.acceptsDelivery}
                    onChange={handleFarmerChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="acceptsDelivery"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Offers Delivery
                  </label>
                </div>

                {farmerForm.acceptsDelivery && (
                  <div>
                    <label
                      htmlFor="deliveryRadius"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Delivery Radius (miles)
                    </label>
                    <input
                      type="number"
                      id="deliveryRadius"
                      name="deliveryRadius"
                      value={farmerForm.deliveryRadius}
                      onChange={handleFarmerChange}
                      className="form-input w-32"
                      min="0"
                    />
                  </div>
                )}
              </div>
            </div>            <button
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
      )}
    </div>
  );
};

export default ProfilePage;
