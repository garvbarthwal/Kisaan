import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getFarmerProfile,
  clearFarmerProfile,
} from "../redux/slices/farmerSlice";
import { getProducts } from "../redux/slices/productSlice";
import { sendMessage } from "../redux/slices/messageSlice";
import ProductCard from "../components/ProductCard";
import Loader from "../components/Loader";
import VerificationBadge from "../components/VerificationBadge";
import {
  FaLeaf,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaArrowLeft,
  FaComment,
} from "react-icons/fa";

const FarmerDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [showMessageForm, setShowMessageForm] = useState(false);
  const [message, setMessage] = useState("");

  const { farmerProfile, loading } = useSelector((state) => state.farmers);
  const { products, loading: productsLoading } = useSelector(
    (state) => state.products
  );
  const { isAuthenticated } = useSelector((state) => state.auth);
  useEffect(() => {
    // Always fetch fresh data when the ID changes
    dispatch(getFarmerProfile(id));
    dispatch(getProducts({ farmer: id }));

    return () => {
      dispatch(clearFarmerProfile());
    };
  }, [dispatch, id]);

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!message.trim()) {
      return;
    }

    dispatch(
      sendMessage({
        receiver: id,
        content: message,
      })
    );

    setMessage("");
    setShowMessageForm(false);
  };

  if (loading) {
    return <Loader />;
  } if (!farmerProfile) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg">
          Farmer profile not found
        </div>
      </div>
    );
  }
  const {
    name,
    email,
    phoneNumber,
    address,
    farmerProfile: profile,
  } = farmerProfile;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center mb-6">
        <Link
          to="/farmers"
          className="flex items-center text-gray-600 hover:text-green-700"
        >
          <FaArrowLeft className="mr-2" />
          Back to Farmers
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-10">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 bg-gradient-to-br from-green-500 to-green-700 p-8 text-white">
            <div className="flex flex-col h-full">
              <div className="flex-grow">
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-6 relative">
                  <FaLeaf className="text-4xl" />
                </div>
                <h1 className="text-3xl font-bold mb-2">{name}</h1>

                {/* Verification Status */}
                <div className="mb-4">
                  <VerificationBadge
                    isVerified={profile?.isVerified || false}
                    size="md"
                    style="full"
                    showText={true}
                  />
                </div>

                {address && (
                  <div className="flex items-start mb-4">
                    <FaMapMarkerAlt className="mt-1 mr-2" />
                    <p>
                      {address.street && `${address.street}, `}
                      {address.city && `${address.city}, `}
                      {address.state && `${address.state}, `}
                      {address.zipCode}
                    </p>
                  </div>
                )}

                {phoneNumber && (
                  <div className="flex items-center mb-4">
                    <FaPhone className="mr-2" />
                    <p>{phoneNumber}</p>
                  </div>
                )}

                <div className="flex items-center mb-4">
                  <FaEnvelope className="mr-2" />
                  <p>{email}</p>
                </div>

                {profile && profile.establishedYear && (
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-2" />
                    <p>
                      Established: {profile.establishedYear}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowMessageForm(!showMessageForm)}
                  className="w-full flex items-center justify-center bg-white text-green-700 hover:bg-green-50 font-bold rounded-lg px-6 py-3 transition-colors"
                >
                  <FaComment className="mr-2" />
                  Send Message
                </button>
              </div>
            </div>
          </div>

          <div className="md:w-2/3 p-8">
            {showMessageForm && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium mb-3">
                  Send a message to {name}
                </h3>
                <form onSubmit={handleSendMessage}>
                  <textarea
                    className="w-full p-3 border rounded-md focus:ring-green-500 focus:border-green-500"
                    rows={4}
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  ></textarea>
                  <div className="flex justify-end mt-3 space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowMessageForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </div>
            )}            {profile && profile.description && (
              <div>
                <h2 className="text-2xl font-bold mb-4">About the Farm</h2>
                <p className="text-gray-700 mb-6">{profile.description}</p>
              </div>
            )}

            {/* Farm Images Gallery */}
            {profile && profile.farmImages && profile.farmImages.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">
                  Farm Gallery
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {profile.farmImages.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
                        <img
                          src={imageUrl || "/placeholder.svg"}
                          alt={`${profile.farmName || name} farm image ${index + 1}`}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105 cursor-pointer"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/placeholder.svg";
                          }}
                          onClick={() => {
                            // You can add a modal or lightbox functionality here if needed
                            window.open(imageUrl, '_blank');
                          }}
                        />
                      </div>
                      {/* Image index indicator */}
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Click on images to view them in full size
                </p>
              </div>
            )}

            {profile && profile.farmingPractices && profile.farmingPractices.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">
                  Farming Practices
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.farmingPractices.map((practice, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full"
                    >
                      {practice}
                    </span>
                  ))}
                </div>
              </div>
            )}            {profile && profile.socialMedia && (profile.socialMedia.facebook || profile.socialMedia.instagram || profile.socialMedia.twitter) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">
                  Social Media
                </h3>
                <div className="flex space-x-4">
                  {profile.socialMedia.facebook && (
                    <a
                      href={profile.socialMedia.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaFacebook className="text-2xl" />
                    </a>
                  )}
                  {profile.socialMedia.instagram && (
                    <a
                      href={profile.socialMedia.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-600 hover:text-pink-800"
                    >
                      <FaInstagram className="text-2xl" />
                    </a>
                  )}
                  {profile.socialMedia.twitter && (
                    <a
                      href={profile.socialMedia.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-600"
                    >
                      <FaTwitter className="text-2xl" />
                    </a>
                  )}
                </div>
              </div>
            )}            {/* Business Hours - only show if any day has hours set */}
            {profile && profile.businessHours && Object.values(profile.businessHours).some(
              (day) => day && day.open && day.close && day.open.trim() !== "" && day.close.trim() !== ""
            ) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">
                    Business Hours
                  </h3>
                  <div className="text-gray-700">
                    <div className="space-y-1">
                      {Object.entries(profile.businessHours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between">
                          <span className="capitalize">{day}:</span>
                          <span>
                            {hours?.open && hours?.close
                              ? `${hours.open} - ${hours.close}`
                              : "Closed"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Products from this Farmer</h2>
        </div>

        {productsLoading ? (
          <Loader />
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <p className="text-gray-600">
              No products available from this farmer yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerDetailPage;
