import { Link } from "react-router-dom";
import { FaLeaf, FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Map link text to their correct paths
  const linkMap = {
    Home: "/",
    Products: "/products",
    Farmers: "/farmers",
    "About Us": "/about",
  };

  return (
    <footer className="bg-gray-900 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FaLeaf className="text-green-400 text-2xl" />
              <h3 className="text-xl font-bold">Kisaan</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Connecting local farmers with consumers for fresh, sustainable
              produce.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {Object.keys(linkMap).map((text, i) => (
                <li key={i}>
                  <Link
                    to={linkMap[text]}
                    className="text-gray-400 hover:text-green-400 transition"
                  >
                    {text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">
              Contact Us
            </h3>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-green-400 mt-1" />
                <span>Dehradun, Uttarakhand, India</span>
              </li>
              <li className="flex items-center gap-3">
                <FaPhone className="text-green-400" />
                <span>09999999999</span>
              </li>
              <li className="flex items-center gap-3">
                <FaEnvelope className="text-green-400" />
                <span>info@kisanconnect.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-10 pt-6 text-center text-gray-500 text-sm">
          <p>&copy; {currentYear} Kisaan. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
