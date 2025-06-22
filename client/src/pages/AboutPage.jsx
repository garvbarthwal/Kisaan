import { Link } from "react-router-dom";
import {
  FaLeaf,
  FaUsers,
  FaHandshake,
  FaShoppingBasket,
  FaCheck,
} from "react-icons/fa";

const teamMembers = [
  {
    id: 1,
    name: "Aditya Jolly",
    linkedin: "https://www.linkedin.com/in/aditya-jolly/",
  },
  {
    id: 2,
    name: "Garv Barthwal",
    linkedin: "https://www.linkedin.com/in/garv-barthwal-463b47294",
  },

  {
    id: 3,
    name: "Pixel Kathait",
    linkedin: "https://www.linkedin.com/in/pixel-kathait-48a8552b6",
  },

  {
    id: 4,
    name: "Vimarsh Thakur",
    linkedin: "https://www.linkedin.com/in/vimarsh-thakur?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
  },
];

const AboutPage = () => {

  return (
    <div>
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-green-50 to-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative z-10 w-full">
          <div className="max-w-4xl mx-auto text-center px-4">
            <div className="inline-block bg-green-100 text-green-800 text-xs font-semibold rounded-full px-3 py-1 mb-6 shadow-sm border border-green-200">
              <span className="uppercase tracking-wider">Our Story</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-gray-900">
              About Kisaan
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-10">
              Connecting local farmers with consumers to promote sustainable agriculture and strengthen community bonds.
            </p>
          </div>
        </div>
      </section>

      <div className="container  mx-auto px-4 py-12">
        <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="bg-white/70 backdrop-blur-md shadow-xl p-10 rounded-3xl max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="md:w-1/2 text-center md:text-left">
                  <h2 className="text-4xl font-extrabold text-green-700 mb-6 leading-tight">
                    Our Mission
                  </h2>
                  <p className="text-gray-800 text-lg mb-4">
                    Kisaan was founded with a simple yet powerful mission: to create a direct link between local farmers and consumers. We believe everyone deserves access to fresh, locally grown produce and farmers deserve fair compensation.
                  </p>
                  <p className="text-gray-800 text-lg">
                    By eliminating middlemen and creating a transparent marketplace, we're building a sustainable food system that benefits both producers and consumers while reducing environmental impact.
                  </p>
                </div>

                <div className="md:w-1/2 flex justify-center">
                  <div className="w-60 h-60 bg-green-100 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-300">
                    <FaLeaf className="text-green-600 text-7xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-extrabold text-center text-green-700 mb-16">
              What Makes Us Different
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="bg-white rounded-3xl shadow-xl p-8 transform hover:-translate-y-2 transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <FaHandshake className="text-2xl text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3">Direct Relationships</h3>
                    <p className="text-gray-700">
                      We foster direct relationships between farmers and consumers, eliminating middlemen and allowing farmers to earn fair prices for their produce while consumers get fresher food.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-xl p-8 transform hover:-translate-y-2 transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <FaLeaf className="text-2xl text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3">Sustainability Focus</h3>
                    <p className="text-gray-700">
                      We prioritize sustainable farming practices, reducing food miles, and minimizing packaging waste. Our platform encourages environmentally responsible choices.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-xl p-8 transform hover:-translate-y-2 transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <FaUsers className="text-2xl text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3">Community Building</h3>
                    <p className="text-gray-700">
                      Beyond transactions, we're building a community where farmers and consumers can connect, share knowledge, and support local food systems together.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-xl p-8 transform hover:-translate-y-2 transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <FaShoppingBasket className="text-2xl text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3">Diverse Selection</h3>
                    <p className="text-gray-700">
                      From seasonal vegetables to artisanal products, we offer a diverse range of locally produced goods that support small-scale farmers and traditional farming practices.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-extrabold text-center text-green-700 mb-16">
              Meet Our Team
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300"
                >
                  <h3 className="font-bold">{member.name}</h3>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm hover:underline"
                  >
                    LinkedIn
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 bg-gradient-to-b from-white to-green-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-extrabold text-green-700 mb-6">
                Join the Kisaan Movement
              </h2>
              <p className="text-xl text-gray-700 mb-12">
                Whether you're a farmer looking to reach new customers or a consumer seeking fresh local produce, Kisaan is your platform for connection and community.
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="btn btn-primary px-8 py-3 text-lg rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  Join as Farmer
                </Link>
                <Link
                  to="/register"
                  className="btn bg-white text-green-700 hover:bg-green-50 px-8 py-3 text-lg rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  Register as Consumer
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
