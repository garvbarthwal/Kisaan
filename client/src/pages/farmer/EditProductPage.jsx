import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getProductDetails,
  updateProduct,
  resetProductSuccess,
} from "../../redux/slices/productSlice";
import { getCategories } from "../../redux/slices/categorySlice";
import { getMyFarmerProfile } from "../../redux/slices/farmerSlice";
import Loader from "../../components/Loader";
import UploadProgress from "../../components/UploadProgress";
import { FaArrowLeft, FaUpload, FaTimes, FaClock, FaEdit, FaCheck, FaInfoCircle, FaTruck, FaMapMarkerAlt } from "react-icons/fa";
import { toast } from "react-toastify";

const EditProductPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { product, loading, success } = useSelector((state) => state.products);
  const { categories, loading: categoriesLoading } = useSelector(
    (state) => state.categories
  );
  const { myFarmerProfile } = useSelector((state) => state.farmers);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    unit: "lb",
    quantityAvailable: "",
    images: [],
    isOrganic: false,
    harvestDate: "",
    availableUntil: "",
    isActive: true,
    fulfillmentOptions: {
      delivery: false,
      pickup: false,
    },
    pickupHours: null,
  });
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [errors, setErrors] = useState({});

  // Upload progress states
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    progress: 0,
    uploadComplete: false,
    uploadError: null,
  });
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickupSchedule, setPickupSchedule] = useState({
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
  });

  useEffect(() => {
    dispatch(getProductDetails(id));
    dispatch(getCategories());
    dispatch(getMyFarmerProfile());
  }, [dispatch, id]);
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        category: product.category?._id || "",
        price: product.price || "",
        unit: product.unit || "lb",
        quantityAvailable: product.quantityAvailable || "",
        images: product.images || [],
        isOrganic: product.isOrganic || false,
        harvestDate: product.harvestDate
          ? new Date(product.harvestDate).toISOString().split("T")[0]
          : "",
        availableUntil: product.availableUntil
          ? new Date(product.availableUntil).toISOString().split("T")[0]
          : "",
        isActive: product.isActive !== undefined ? product.isActive : true,
        fulfillmentOptions: product.fulfillmentOptions || { delivery: false, pickup: false },
        pickupHours: product.pickupHours || null,
      });
      setImagePreviewUrls(product.images || []);
      // Set pickupSchedule from product or default
      if (product.fulfillmentOptions?.pickup) {
        if (product.pickupHours) {
          setPickupSchedule({
            useBusinessHours: false,
            customHours: product.pickupHours,
          });
        } else {
          setPickupSchedule((prev) => ({ ...prev, useBusinessHours: true }));
        }
      } else {
        setPickupSchedule({
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
        });
      }
    }
  }, [product]);

  useEffect(() => {
    if (success) {
      dispatch(resetProductSuccess());
      navigate("/farmer/products");
    }
  }, [success, dispatch, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("fulfillmentOptions.")) {
      const option = name.split(".")[1];
      setFormData({
        ...formData,
        fulfillmentOptions: {
          ...formData.fulfillmentOptions,
          [option]: checked,
        },
      });
      if (option === "pickup" && checked) {
        setShowPickupModal(true);
        if (myFarmerProfile?.businessHours) {
          setPickupSchedule((prev) => ({
            ...prev,
            customHours: { ...myFarmerProfile.businessHours },
          }));
        }
      }
      if (option === "pickup" && !checked) {
        toast.info(
          "Pickup option disabled - customers won't be able to pick up this product"
        );
      }
      if (option === "delivery") {
        if (checked) {
          toast.success(
            "Delivery enabled - you'll need to deliver this product to customers"
          );
        } else {
          toast.info(
            "Delivery disabled - customers won't be able to request delivery"
          );
        }
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    // Clear input value to allow re-selecting the same files
    e.target.value = "";

    try {
      // Import the upload utility
      const { uploadProductImages, validateImages } = await import(
        "../../utils/imageUpload"
      );

      // Validate images before attempting to upload
      const validation = validateImages(files);
      if (!validation.valid) {
        setErrors({
          ...errors,
          images: validation.errors[0], // Show the first error
        });
        return;
      }

      // Set upload state
      setUploadState((prev) => ({
        ...prev,
        isUploading: true,
        progress: 0,
        uploadError: null,
      }));

      // Upload images immediately to Cloudinary
      const imageUrls = await uploadProductImages(files, {
        validate: false, // Already validated
        onUploadStart: () => {
          setUploadState((prev) => ({
            ...prev,
            isUploading: true,
            progress: 0,
            uploadError: null,
          }));
        },
        onProgress: (progress) => {
          setUploadState((prev) => ({
            ...prev,
            progress,
          }));
        },
        onUploadComplete: () => {
          setUploadState((prev) => ({
            ...prev,
            isUploading: false,
            uploadComplete: true,
          }));
        },
      });

      // Validate that we received valid Cloudinary URLs
      const validImageUrls = imageUrls.filter(
        (url) =>
          typeof url === "string" &&
          (url.startsWith("http://") || url.startsWith("https://")) &&
          !url.startsWith("blob:")
      );

      if (validImageUrls.length === 0) {
        throw new Error("No valid image URLs received from upload");
      }

      // Update state with validated Cloudinary URLs only (combine with existing images)
      const newImages = [...(formData.images || []), ...validImageUrls];
      setImagePreviewUrls([...imagePreviewUrls, ...validImageUrls]);
      setFormData({
        ...formData,
        images: newImages,
      });

      // Clear any previous errors
      if (errors.images) {
        const newErrors = { ...errors };
        delete newErrors.images;
        setErrors(newErrors);
      }
    } catch (error) {
      setUploadState((prev) => ({
        ...prev,
        isUploading: false,
        uploadError: error.message || "Failed to upload images. Please try again.",
      }));
      setErrors({
        ...errors,
        images: error.message || "Failed to upload images. Please try again.",
      });
    }
  };
  const removeImage = (index) => {
    const newImagePreviewUrls = [...imagePreviewUrls];
    const newImages = [...(formData.images || [])];

    // Remove the preview URL and the corresponding image URL
    newImagePreviewUrls.splice(index, 1);
    newImages.splice(index, 1);

    setImagePreviewUrls(newImagePreviewUrls);
    setFormData({
      ...formData,
      images: newImages,
    });
  };

  const handlePickupTimeChange = (day, type, value) => {
    setPickupSchedule((prev) => ({
      ...prev,
      customHours: {
        ...prev.customHours,
        [day]: {
          ...prev.customHours[day],
          [type]: value,
        },
      },
    }));
  };
  const handlePickupClosedToggle = (day) => {
    setPickupSchedule((prev) => ({
      ...prev,
      customHours: {
        ...prev.customHours,
        [day]: {
          ...prev.customHours[day],
          closed: !prev.customHours[day].closed,
          open: !prev.customHours[day].closed ? "" : prev.customHours[day].open,
          close: !prev.customHours[day].closed ? "" : prev.customHours[day].close,
        },
      },
    }));
  };
  const handleSameForAllPickupHours = () => {
    const mondayHours = pickupSchedule.customHours.monday;
    if (!mondayHours.closed && mondayHours.open && mondayHours.close) {
      const newCustomHours = {};
      Object.keys(pickupSchedule.customHours).forEach((day) => {
        newCustomHours[day] = { ...mondayHours };
      });
      setPickupSchedule((prev) => ({
        ...prev,
        customHours: newCustomHours,
      }));
      toast.success("Monday pickup hours applied to all days!");
    } else {
      toast.error("Please set Monday opening and closing times first!");
    }
  };
  const handleSavePickupHours = () => {
    if (pickupSchedule.useBusinessHours) {
      if (!myFarmerProfile?.businessHours) {
        toast.error("Please set your business hours first in your profile!");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        pickupHours: null,
      }));
      toast.success("Pickup hours set to use your business hours!");
    } else {
      const hasValidDay = Object.values(pickupSchedule.customHours).some(
        (day) => !day.closed && day.open && day.close
      );
      if (!hasValidDay) {
        toast.error("Please set pickup hours for at least one day!");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        pickupHours: pickupSchedule.customHours,
      }));
      toast.success("Custom pickup hours saved successfully!");
    }
    setShowPickupModal(false);
  };
  const handleCancelPickupModal = () => {
    setShowPickupModal(false);
    if (!formData.pickupHours && pickupSchedule.useBusinessHours) {
      setFormData((prev) => ({
        ...prev,
        fulfillmentOptions: {
          ...prev.fulfillmentOptions,
          pickup: false,
        },
      }));
      toast.info(
        "Pickup option canceled - configure pickup hours to enable pickup"
      );
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.price || formData.price <= 0)
      newErrors.price = "Valid price is required";
    if (!formData.unit.trim()) newErrors.unit = "Unit is required";
    if (!formData.quantityAvailable || formData.quantityAvailable < 0)
      newErrors.quantityAvailable = "Valid quantity is required";

    // Validate fulfillment options - but don't require them for updates (for backward compatibility)
    // if (!formData.fulfillmentOptions.delivery && !formData.fulfillmentOptions.pickup) {
    //   newErrors.fulfillmentOptions = "Please select at least one fulfillment option (Delivery or Pickup)";
    // }

    // Additional validation for pickup hours if pickup is selected
    if (formData.fulfillmentOptions.pickup) {
      if (!formData.pickupHours && (!pickupSchedule.useBusinessHours || !myFarmerProfile?.businessHours)) {
        newErrors.fulfillmentOptions = "Please configure pickup hours or set your business hours first";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        // Images are already uploaded to Cloudinary and stored in formData.images
        // Just update the product with the existing image URLs
        dispatch(updateProduct({ id, productData: formData }));
      } catch (error) {
        setErrors({
          ...errors,
          submit: error.message || "Failed to update product. Please try again.",
        });
      }
    }
  };

  if (loading || categoriesLoading) {
    return <Loader />;
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <span className="block sm:inline">Product not found</span>
        </div>
        <Link
          to="/farmer/products"
          className="mt-4 inline-block text-green-500 hover:text-green-700"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        to="/farmer/products"
        className="flex items-center text-green-500 hover:text-green-700 mb-6"
      >
        <FaArrowLeft className="mr-2" />
        Back to Products
      </Link>

      <div className="glass p-6 rounded-xl">
        <h1 className="text-3xl font-bold mb-6">Edit Product</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Product Name*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`form-input ${errors.name ? "border-red-500" : ""
                  }`}
                required
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category*
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`form-input ${errors.category ? "border-red-500" : ""
                  }`}
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category}</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description*
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className={`form-input ${errors.description ? "border-red-500" : ""
                }`}
              placeholder="Describe your product..."
              required
            ></textarea>
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Price*
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">₨</span>
                </div>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className={`form-input pl-7 ${errors.price ? "border-red-500" : ""
                    }`}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              {errors.price && (
                <p className="text-red-500 text-xs mt-1">{errors.price}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="unit"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Unit*
              </label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className={`form-input ${errors.unit ? "border-red-500" : ""
                  }`}
                required
              >
                <option value="lb">Pound (lb)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="oz">Ounce (oz)</option>
                <option value="g">Gram (g)</option>
                <option value="each">Each</option>
                <option value="bunch">Bunch</option>
                <option value="dozen">Dozen</option>
                <option value="pint">Pint</option>
                <option value="quart">Quart</option>
                <option value="gallon">Gallon</option>
              </select>
              {errors.unit && (
                <p className="text-red-500 text-xs mt-1">{errors.unit}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="quantityAvailable"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Quantity Available*
              </label>
              <input
                type="number"
                id="quantityAvailable"
                name="quantityAvailable"
                value={formData.quantityAvailable}
                onChange={handleChange}
                className={`form-input ${errors.quantityAvailable ? "border-red-500" : ""
                  }`}
                min="0"
                required
              />
              {errors.quantityAvailable && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.quantityAvailable}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label
                htmlFor="harvestDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Harvest Date
              </label>
              <input
                type="date"
                id="harvestDate"
                name="harvestDate"
                value={formData.harvestDate}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label
                htmlFor="availableUntil"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Available Until
              </label>
              <input
                type="date"
                id="availableUntil"
                name="availableUntil"
                value={formData.availableUntil}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isOrganic"
                  name="isOrganic"
                  checked={formData.isOrganic}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isOrganic"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Organic
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Active
                </label>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Images
            </label>
            <div className="flex items-center space-x-4">
              <label className="cursor-pointer bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50">
                <div className="flex items-center space-x-2">
                  <FaUpload className="text-gray-500" />
                  <span>Upload Images</span>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <span className="text-sm text-gray-500">
                Upload up to 5 images
              </span>
            </div>

            {/* Upload Progress Component */}
            <UploadProgress
              isUploading={uploadState.isUploading}
              progress={uploadState.progress}
              uploadComplete={uploadState.uploadComplete}
              uploadError={uploadState.uploadError}
              fileCount={formData.imageFiles?.length || 0}
              className="mt-4"
            />

            {imagePreviewUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url || "/placeholder.svg"}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fulfillment Options */}
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
                      onChange={handleChange}
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
                      onChange={handleChange}
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

                {/* Pickup Hours Configuration */}
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

                    {/* Hours Preview */}
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

          <div className="flex justify-end space-x-4">
            <Link
              to="/farmer/products"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || uploadState.isUploading}
            >
              {uploadState.isUploading
                ? `Uploading... ${uploadState.progress}%`
                : loading
                  ? "Saving..."
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Pickup Hours Modal */}
      {showPickupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Configure Pickup Hours</h2>
                  <p className="text-gray-600 mt-1">
                    Set when customers can pick up this product from your farm.
                  </p>
                </div>
                <button
                  onClick={handleCancelPickupModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Use Business Hours Toggle */}
              <div className="mb-6">
                <div className={`flex items-center space-x-4 p-4 border-2 rounded-xl transition-all duration-300 ${pickupSchedule.useBusinessHours
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
                  }`}>
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="useBusinessHours"
                      checked={pickupSchedule.useBusinessHours}
                      onChange={(e) => setPickupSchedule(prev => ({ ...prev, useBusinessHours: e.target.checked }))
                      }
                      className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg transition-colors ${pickupSchedule.useBusinessHours
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-green-600'
                      }`}>
                      <FaClock className="text-lg" />
                    </div>
                    <div>
                      <label htmlFor="useBusinessHours" className="text-sm font-semibold text-gray-900 cursor-pointer">
                        Use my business hours for pickup
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Customers can pick up during your regular business hours
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Hours (only shown if not using business hours) */}
              {!pickupSchedule.useBusinessHours && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Custom Pickup Hours</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Set specific hours when customers can pick up products
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSameForAllPickupHours}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                    >
                      <FaCheck className="text-sm" />
                      <span>Same for all</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(pickupSchedule.customHours).map(([day, hours]) => (
                      <div key={day} className={`border-2 rounded-xl p-4 transition-all duration-300 ${hours.closed
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 hover:border-green-300'
                        }`}>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-900 capitalize">{day}</h4>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`${day}-closed`}
                              checked={hours.closed}
                              onChange={() => handlePickupClosedToggle(day)}
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`${day}-closed`} className="text-sm font-medium text-red-600">
                              Closed
                            </label>
                          </div>
                        </div>

                        {!hours.closed && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Opening Time
                                </label>
                                <input
                                  type="time"
                                  value={hours.open}
                                  onChange={(e) => handlePickupTimeChange(day, 'open', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Closing Time
                                </label>
                                <input
                                  type="time"
                                  value={hours.close}
                                  onChange={(e) => handlePickupTimeChange(day, 'close', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                />
                              </div>
                            </div>
                            {hours.open && hours.close && (
                              <div className="flex items-center space-x-2 text-xs text-green-600 bg-green-50 p-2 rounded-lg">
                                <FaCheck className="text-green-500" />
                                <span>Open {hours.open} - {hours.close}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Business Hours Preview (when using business hours) */}
              {pickupSchedule.useBusinessHours && myFarmerProfile?.businessHours && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Your Business Hours</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      These hours will be used for customer pickups
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(myFarmerProfile.businessHours).map(([day, hours]) => (
                      <div key={day} className={`border-2 rounded-xl p-4 transition-all ${hours.closed
                        ? 'border-red-200 bg-red-50'
                        : 'border-green-200 bg-green-50'
                        }`}>
                        <div className="flex flex-col items-start">
                          <h4 className="font-semibold text-gray-900 capitalize mb-1">{day}</h4>
                          {hours.closed ? (
                            <span className="text-red-600 text-sm font-medium">Closed</span>
                          ) : (
                            <span className="text-green-600 text-sm font-medium">
                              {hours.open} - {hours.close}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleCancelPickupModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePickupHours}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                  Save Pickup Hours
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProductPage;
