import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLanguage } from "../redux/slices/languageSlice";
import { FaGlobe, FaChevronDown } from "react-icons/fa";

const LanguageSelector = ({ isMobile = false, onLanguageSelect }) => {
    const dispatch = useDispatch();
    const { currentLanguage, supportedLanguages } = useSelector(
        (state) => state.language
    );
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const currentLang = supportedLanguages.find(lang => lang.code === currentLanguage);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLanguageSelect = (languageCode) => {
        dispatch(setLanguage(languageCode));
        setIsOpen(false);
        // Call the callback if provided (for mobile menu closing)
        if (onLanguageSelect) {
            onLanguageSelect();
        }
    };

    if (isMobile) {
        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center space-x-2 w-full text-left text-gray-700 hover:text-green-500 transition-colors py-2"
                >
                    <FaGlobe className="text-lg" />
                    <span>{currentLang?.nativeName || 'English'}</span>
                    <FaChevronDown className={`text-sm transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {supportedLanguages.map((language) => (
                            <button
                                key={language.code}
                                onClick={() => handleLanguageSelect(language.code)}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${currentLanguage === language.code
                                    ? "bg-green-50 text-green-700 font-medium"
                                    : "hover:bg-gray-50"
                                    }`}
                            >
                                {language.nativeName}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-green-500 transition-colors focus:outline-none px-3 py-2 rounded-lg hover:bg-green-50"
            >
                <FaGlobe className="text-lg" />
                <span className="hidden sm:inline font-medium">{currentLang?.nativeName || 'English'}</span>
                <FaChevronDown className={`text-sm transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <div className="py-1">
                        {supportedLanguages.map((language) => (
                            <button
                                key={language.code}
                                onClick={() => handleLanguageSelect(language.code)}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${currentLanguage === language.code
                                    ? "bg-green-50 text-green-700 font-medium"
                                    : "hover:bg-gray-50"
                                    }`}
                            >
                                {language.nativeName}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;
