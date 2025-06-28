import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { getProducts } from "../redux/slices/productSlice";
import { getAllFarmers } from "../redux/slices/farmerSlice";
import { getCategories } from "../redux/slices/categorySlice";
import ProductCard from "../components/ProductCard";
import FarmerCard from "../components/FarmerCard";
import Loader from "../components/Loader";
import { FaLeaf, FaUsers, FaShoppingBasket, FaHandshake } from "react-icons/fa";

const HomePage = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const { products = [], loading: productLoading } = useSelector(
    (state) => state.products
  );
  const { farmers = [], loading: farmerLoading } = useSelector(
    (state) => state.farmers
  );
  const { categories = [] } = useSelector((state) => state.categories);

  useEffect(() => {
    dispatch(getProducts({ limit: 8 }));
    dispatch(getAllFarmers());
    dispatch(getCategories());
  }, [dispatch]);

  if (productLoading || farmerLoading) {
    return <Loader />;
  }

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
          <div className="max-w-2xl mx-auto text-center px-4">
            <div className="inline-block bg-green-100 text-green-800 text-xs font-semibold rounded-full px-3 py-1 mb-6 shadow-sm border border-green-200">
              <span className="uppercase tracking-wider">
                {t('homePage.kisaan')}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900">
              {t('homePage.connectDirectly')}
            </h1>
            <p className="text-base md:text-lg text-gray-600 mb-10">
              {t('homePage.freshLocalProduce')}
              <br className="hidden md:block" />
              {t('homePage.supportLocal')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/products"
                className="btn btn-primary px-8 py-3 text-lg rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {t('homePage.shopNow')}
              </Link>
              <Link
                to="/farmers"
                className="btn btn-outline px-8 py-3 text-lg rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {t('homePage.meetOurFarmers')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">
            {t('homePage.whyChooseKisaan')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="glass p-4 rounded-2xl text-center transition-transform duration-300 shadow-lg hover:shadow-xl">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaLeaf className="text-green-500 text-3xl" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{t('homePage.freshLocal')}</h3>
              <p className="text-gray-600">
                {t('homePage.freshLocalDesc')}
              </p>
            </div>

            <div className="glass p-4 rounded-2xl text-center transition-transform duration-300 shadow-lg hover:shadow-xl">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaUsers className="text-green-500 text-3xl" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{t('homePage.supportFarmers')}</h3>
              <p className="text-gray-600">
                {t('homePage.supportFarmersDesc')}
              </p>
            </div>

            <div className="glass p-4 rounded-2xl text-center transition-transform duration-300 shadow-lg hover:shadow-xl">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaShoppingBasket className="text-green-500 text-3xl" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{t('homePage.wideSelection')}</h3>
              <p className="text-gray-600">
                {t('homePage.wideSelectionDesc')}
              </p>
            </div>

            <div className="glass p-4 rounded-2xl text-center transition-transform duration-300 shadow-lg hover:shadow-xl">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaHandshake className="text-green-500 text-3xl" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{t('homePage.community')}</h3>
              <p className="text-gray-600">
                {t('homePage.communityDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by Category Section */}
      <section className="py-24 bg-gradient-to-b from-white to-green-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">
            {t('homePage.browseByCategory')}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {categories.map((category) => (
              <Link
                key={category._id}
                to={`/products?category=${category._id}`}
                className="glass p-6 rounded-xl text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  {category.icon ? (
                    <span className="text-2xl text-green-600">{category.icon}</span>
                  ) : (
                    <FaLeaf className="text-green-500 text-2xl" />
                  )}
                </div>
                <h3 className="font-medium text-gray-900">{category.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">{t('homePage.featuredProducts')}</h2>
            <Link
              to="/products"
              className="text-green-600 hover:text-green-800 font-semibold flex items-center gap-2"
            >
              {t('homePage.seeAllProducts')}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Farmers Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">{t('homePage.meetOurFarmers')}</h2>
            <Link
              to="/farmers"
              className="text-green-600 hover:text-green-800 font-semibold flex items-center gap-2"
            >
              {t('homePage.viewAllFarmers')}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {farmers.slice(0, 4).map((farmer) => (
              <FarmerCard key={farmer._id} farmer={farmer} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-white to-green-50">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-7/12 p-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  {t('homePage.readyToExperience')}
                </h2>
                <p className="text-green-100 mb-8 text-lg">
                  {t('homePage.joinCommunityToday')}
                </p>
                <div className="flex gap-4">
                  <Link
                    to="/register"
                    className="btn bg-white text-green-700 hover:bg-green-50 px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition duration-300"
                  >
                    {t('homePage.getStarted')}
                  </Link>
                  <Link
                    to="/about"
                    className="btn btn-outline text-white border-white hover:bg-white/10 px-8 py-3 rounded-xl shadow-lg transition duration-300"
                  >
                    {t('homePage.learnMore')}
                  </Link>
                </div>
              </div>
              <div className="md:w-5/12 p-6 md:p-0">
                <div className="bg-white/30 backdrop-blur-sm h-full w-full rounded-3xl flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-6 p-6">
                    <div className="bg-green-700/40 rounded-2xl p-4 text-center backdrop-blur-sm">
                      <span className="text-4xl font-bold text-white block mb-2">
                        {farmers.length}+
                      </span>
                      <span className="text-green-50">{t('homePage.farmers')}</span>
                    </div>
                    <div className="bg-green-700/40 rounded-2xl p-4 text-center backdrop-blur-sm">
                      <span className="text-4xl font-bold text-white block mb-2">
                        {products.length}+
                      </span>
                      <span className="text-green-50">{t('homePage.products')}</span>
                    </div>
                    <div className="bg-green-700/40 rounded-2xl p-4 text-center backdrop-blur-sm">
                      <span className="text-4xl font-bold text-white block mb-2">
                        {categories.length}
                      </span>
                      <span className="text-green-50">{t('homePage.categories')}</span>
                    </div>
                    <div className="bg-green-700/40 rounded-2xl p-4 text-center backdrop-blur-sm">
                      <span className="text-4xl font-bold text-white block mb-2">
                        {t('homePage.twentyFourSeven')}
                      </span>
                      <span className="text-green-50">{t('homePage.support')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
