import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

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
              <span className="uppercase tracking-wider">{t('aboutPage.ourStory')}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-gray-900">
              {t('aboutPage.aboutKisaan')}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-10">
              {t('aboutPage.heroDescription')}
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
                    {t('aboutPage.ourMission')}
                  </h2>
                  <p className="text-gray-800 text-lg mb-4">
                    {t('aboutPage.missionDescription1')}
                  </p>
                  <p className="text-gray-800 text-lg">
                    {t('aboutPage.missionDescription2')}
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
              {t('aboutPage.whatMakesUsDifferent')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="bg-white rounded-3xl shadow-xl p-8 transform hover:-translate-y-2 transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <FaHandshake className="text-2xl text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3">{t('aboutPage.directRelationships')}</h3>
                    <p className="text-gray-700">
                      {t('aboutPage.directRelationshipsDesc')}
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
                    <h3 className="text-xl font-bold mb-3">{t('aboutPage.sustainabilityFocus')}</h3>
                    <p className="text-gray-700">
                      {t('aboutPage.sustainabilityFocusDesc')}
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
                    <h3 className="text-xl font-bold mb-3">{t('aboutPage.communityBuilding')}</h3>
                    <p className="text-gray-700">
                      {t('aboutPage.communityBuildingDesc')}
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
                    <h3 className="text-xl font-bold mb-3">{t('aboutPage.diverseSelection')}</h3>
                    <p className="text-gray-700">
                      {t('aboutPage.diverseSelectionDesc')}
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
              {t('aboutPage.meetOurTeam')}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300"
                >
                  <h3 className="font-bold">{member.name}</h3>                    <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm hover:underline"
                  >
                    {t('aboutPage.linkedin')}
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
                {t('aboutPage.joinMovement')}
              </h2>
              <p className="text-xl text-gray-700 mb-12">
                {t('aboutPage.movementDescription')}
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="btn btn-primary px-8 py-3 text-lg rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {t('aboutPage.joinAsFarmer')}
                </Link>
                <Link
                  to="/register"
                  className="btn bg-white text-green-700 hover:bg-green-50 px-8 py-3 text-lg rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {t('aboutPage.registerAsConsumer')}
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
