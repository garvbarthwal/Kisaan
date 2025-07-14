import { useDispatch, useSelector } from "react-redux";
import { setLanguage, closeLanguagePopup } from "../redux/slices/languageSlice";
import { FaGlobe, FaTimes } from "react-icons/fa";

const LanguageSelectionPopup = () => {
    const dispatch = useDispatch();
    const { showLanguagePopup, supportedLanguages, currentLanguage } = useSelector(
        (state) => state.language
    );

    if (!showLanguagePopup) return null;

    const handleLanguageSelect = (languageCode) => {
        dispatch(setLanguage(languageCode));
    };

    const handleClose = () => {
        dispatch(closeLanguagePopup());
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-sm relative my-4 mx-auto max-h-[90vh] overflow-hidden">
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors z-10"
                >
                    <FaTimes className="text-lg" />
                </button>

                {/* Header */}
                <div className="text-center px-4 pt-6 pb-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                        <FaGlobe className="text-green-600 text-xl" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Select Language</h2>
                    <p className="text-gray-600 text-base">भाषा चुनें</p>
                </div>

                {/* Language options */}
                <div className="px-4 pb-6">
                    <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {supportedLanguages.map((language) => (
                            <button
                                key={language.code}
                                onClick={() => handleLanguageSelect(language.code)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 border-2 ${currentLanguage === language.code
                                        ? "border-green-500 bg-green-50 text-green-700"
                                        : "border-gray-200 hover:border-green-300 hover:bg-green-50"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{language.nativeName}</span>
                                    {currentLanguage === language.code && (
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LanguageSelectionPopup;
