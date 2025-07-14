import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { register, clearError } from "../redux/slices/authSlice";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaPhone,
  FaMapMarkerAlt,
  FaLeaf,
} from "react-icons/fa";
import Loader from "../components/Loader";
import LocationDetector from "../components/LocationDetector";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "consumer",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  const [passwordError, setPasswordError] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, isAuthenticated, user } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    dispatch(clearError());

    if (isAuthenticated) {
      if (user?.role === "admin") {
        navigate("/admin/dashboard");
      } else if (user?.role === "farmer") {
        navigate("/business-hours-setup");
      } else {
        navigate("/");
      }
    }
  }, [dispatch, isAuthenticated, navigate, user]);

  const handleLocationDetected = (locationData) => {
    setFormData({
      ...formData,
      address: {
        ...formData.address,
        // Do NOT update street from detected location
        city: locationData.city,
        state: locationData.state,
        zipCode: locationData.zipCode,
        coordinates: locationData.coordinates,
        locationDetected: locationData.locationDetected,
      },
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: checked,
      });
      return;
    }

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setPasswordError("");
    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      phone: formData.phone,
      address: formData.address,
    };

    dispatch(register(userData));
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass p-10 rounded-xl">
        <div className="text-center">
          <div className="flex justify-center">
            <FaLeaf className="text-green-500 text-4xl" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {"Create your account"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {"Or"}{" "}
            <Link
              to="/login"
              className="font-medium text-green-600 hover:text-green-500"
            >
              {"sign in to your existing account"}
            </Link>
          </p>
        </div>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {passwordError && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{passwordError}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm">
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {"Full Name"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input pl-10"
                  placeholder={"Full Name"}
                />
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {"Email Address"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input pl-10"
                  placeholder={"Email Address"}
                />
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {"Password"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input pl-10"
                  placeholder={"Password"}
                  minLength="6"
                />
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {"Confirm Password"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input pl-10"
                  placeholder={"Confirm Password"}
                  minLength="6"
                />
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {"I am a:"}
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="consumer">{"Consumer"}</option>
                <option value="farmer">{"Farmer"}</option>
              </select>
            </div>

            <div className="mb-4">
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
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input pl-10"
                  placeholder={"Phone Number"}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address & Location
              </label>

              {/* Location Detection Notice */}
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 text-amber-600 mt-0.5">📍</div>
                  <div>
                    <p className="text-sm text-amber-800 font-medium mb-1">
                      Accurate Location Required
                    </p>
                    <p className="text-xs text-amber-700">
                      For precise delivery services, we need your exact location.
                      Please use the "Detect Location" button to automatically fill your address with GPS coordinates.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="text-gray-400" />
                  </div>
                  <input
                    id="street"
                    name="address.street"
                    type="text"
                    value={formData.address.street}
                    onChange={handleChange}
                    className="form-input pl-10"
                    placeholder={"Street address"}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <h3 className="text-sm font-medium text-gray-700">
                    Auto-detect Location
                  </h3>
                  <div className="flex-shrink-0">
                    <LocationDetector
                      onLocationDetected={handleLocationDetected}
                      isLoading={loading}
                      variant="compact"
                    />
                  </div>
                </div>

                {formData.address.coordinates && (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
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

                <div className="grid grid-cols-2 gap-3">
                  <input
                    id="city"
                    name="address.city"
                    type="text"
                    value={formData.address.city}
                    onChange={handleChange}
                    className="form-input pl-3"
                    placeholder={"City"}
                    required
                  />
                  <input
                    id="state"
                    name="address.state"
                    type="text"
                    value={formData.address.state}
                    onChange={handleChange}
                    className="form-input pl-3"
                    placeholder={"State"}
                    required
                  />
                </div>

                <input
                  id="zipCode"
                  name="address.zipCode"
                  type="text"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                  className="form-input pl-3"
                  placeholder={"ZIP / Postal code"}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
