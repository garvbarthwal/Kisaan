import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getProductDetails,
  clearProductDetails,
} from "../redux/slices/productSlice";
import { addToCart } from "../redux/slices/cartSlice";
import { sendMessage } from "../redux/slices/messageSlice";
import Loader from "../components/Loader";
import {
  FaLeaf,
  FaShoppingCart,
  FaMapMarkerAlt,
  FaUser,
  FaComment,
  FaArrowLeft,
} from "react-icons/fa";
import { placeholder } from "../assets";
import { filterValidImageUrls } from "../utils/imageCleanup";

const ProductDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [message, setMessage] = useState("");

  const { product, loading, error } = useSelector((state) => state.products);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { cartItems, farmerId } = useSelector((state) => state.cart);

  useEffect(() => {
    dispatch(getProductDetails(id));

    return () => {
      dispatch(clearProductDetails());
    };
  }, [dispatch, id]);

  const handleQuantityChange = (e) => {
    const value = Number.parseInt(e.target.value);
    setQuantity(value);
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (user.role === "farmer") {
      alert("Farmers cannot place orders. Please use a consumer account.");
      return;
    }

    if (farmerId && farmerId !== product.farmer._id && cartItems.length > 0) {
      if (
        !confirm(
          "Your cart contains items from a different farm. Would you like to clear your cart and add this item?"
        )
      ) {
        return;
      }
    }

    dispatch(addToCart({ product, quantity }));
  };

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
        receiver: product.farmer._id,
        content: message,
      })
    );

    setMessage("");
    setShowMessageForm(false);
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = placeholder;
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {"Error loading product. Please try again."}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg">
          {"Product not found"}
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center mb-6">
        <Link
          to="/products"
          className="flex items-center text-gray-600 hover:text-green-700"
        >
          <FaArrowLeft className="mr-2" />
          {"Back to Products"}
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2">
            {(() => {
              const validImages = filterValidImageUrls(product.images);
              return (
                <>
                  <div className="relative h-96">
                    <img
                      src={validImages && validImages[activeImage]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                    <div className="absolute top-4 right-4 bg-green-100 rounded-full p-2">
                      <FaLeaf className="text-green-600" />
                    </div>
                  </div>

                  {validImages && validImages.length > 1 && (
                    <div className="flex p-4 gap-2 overflow-x-auto">
                      {validImages.map((image, index) => (
                        <button
                          key={index}
                          className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${activeImage === index ? "border-green-500" : "border-gray-200"
                            }`}
                          onClick={() => setActiveImage(index)}
                        >
                          <img
                            src={image}
                            alt={`${product.name} - ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <div className="md:w-1/2 p-6 md:p-8">
            <div className="mb-4">
              {product.category && (
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {product.category.name}
                </span>
              )}
              <h1 className="text-3xl font-bold mt-2">{product.name}</h1>
              <div className="flex items-center mt-2">
                <FaMapMarkerAlt className="text-gray-500 mr-1" />
                <span className="text-gray-500 text-sm">
                  {product.farmer && product.farmer.address
                    ? `${product.farmer.address.city}, ${product.farmer.address.state}`
                    : "Location not specified"}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-2xl font-bold text-green-700">
                ₹{product.price}/{product.unit}
              </div>
              {product.quantityAvailable > 0 ? (
                <div className="text-green-600 mt-1">
                  In Stock: {product.quantityAvailable} {product.unit}
                </div>
              ) : (
                <div className="text-red-600 mt-1">Out of Stock</div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6 mb-6">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-gray-700">{product.description}</p>
            </div>

            {product.quantityAvailable > 0 && (
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="w-full md:w-1/3">
                  <label
                    htmlFor="quantity"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {"Quantity"} ({product.unit})
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    max={product.quantityAvailable}
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="w-full md:w-2/3">
                  <button
                    onClick={handleAddToCart}
                    className="w-full h-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg px-4 py-2"
                  >
                    <FaShoppingCart className="mr-2" />
                    {"Add to Cart"}
                  </button>
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <FaUser className="text-gray-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {"Sold by"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {product.farmer ? product.farmer.name : "Unknown Farmer"}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/farmers/${product.farmer?._id}`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {"View Profile"}
                  </Link>
                  <button
                    onClick={() => setShowMessageForm(!showMessageForm)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                  >
                    <FaComment className="mr-1" /> {"Message"}
                  </button>
                </div>
              </div>
            </div>

            {showMessageForm && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium mb-2">
                  Send a message to {product.farmer?.name}
                </h3>
                <form onSubmit={handleSendMessage}>
                  <textarea
                    className="w-full p-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                    rows={3}
                    placeholder={"Type your message here..."}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  ></textarea>
                  <div className="flex justify-end mt-2 space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowMessageForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                    >
                      {"Cancel"}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700"
                    >
                      {"Send"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
