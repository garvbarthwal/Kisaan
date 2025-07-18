import { Link } from "react-router-dom";
import { placeholder } from "../assets";
import { filterValidImageUrls } from "../utils/imageCleanup";
import VerificationBadge from "./VerificationBadge";

const ProductCard = ({ product }) => {
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = placeholder;
  };

  // Filter out any blob URLs for safety
  const validImages = filterValidImageUrls(product.images);

  return (
    <div className="card transition-transform duration-300">
      <div className="relative h-48 overflow-hidden rounded-t-xl">
        {validImages && validImages.length > 0 ? (
          <img
            src={validImages[0]}
            alt={product.name}
            onError={handleImageError}
            className="w-full h-56 object-cover"
          />
        ) : (
          <div>
            <img
              src={placeholder}
              alt="placeholder"
              className="w-full h-56 object-cover"
            />
          </div>
        )}
        {product.isOrganic && (
          <span className="absolute top-2 right-2 badge badge-green">
            Organic
          </span>
        )}
        <span className={`absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded-full ${product.quantityAvailable > 0
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
          }`}>
          {product.quantityAvailable > 0 ? "In Stock" : "Out of Stock"}
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-1 truncate">{product.name}</h3>
        <p className="text-gray-500 text-sm mb-2">
          {product.category?.name || "General"}
        </p>

        {/* Farmer Information with Verification */}
        {product.farmer && (
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
            <span>by {product.farmer.name}</span>
            <VerificationBadge
              isVerified={product.farmer.farmerProfile?.isVerified || false}
              size="xs"
              style="icon"
            />
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-green-600 font-bold">
            ₨{product.price.toFixed(2)} / {product.unit}
          </span>
          <Link
            to={`/products/${product._id}`}
            className="text-sm text-green-500 hover:text-green-700 font-medium"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
