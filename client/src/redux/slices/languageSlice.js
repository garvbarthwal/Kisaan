import { createSlice } from "@reduxjs/toolkit";

// Supported languages with their native names
const supportedLanguages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी (Hindi)' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা (Bengali)' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు (Telugu)' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी (Marathi)' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ் (Tamil)' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી (Gujarati)' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ (Kannada)' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം (Malayalam)' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ (Punjabi)' },
    { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ (Odia)' },
    { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া (Assamese)' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو (Urdu)' }
];

// Get initial language from localStorage or default to English
const getInitialLanguage = () => {
    const savedLanguage = localStorage.getItem('kisaan_language');
    return savedLanguage || 'en';
};

// Check if user is visiting for the first time
const isFirstTimeUser = () => {
    return !localStorage.getItem('kisaan_language_selected');
};

const initialState = {
    currentLanguage: getInitialLanguage(),
    supportedLanguages,
    showLanguagePopup: isFirstTimeUser(),
    isLanguageSelected: !isFirstTimeUser()
};

const languageSlice = createSlice({
    name: "language",
    initialState,
    reducers: {
        setLanguage: (state, action) => {
            state.currentLanguage = action.payload;
            localStorage.setItem('kisaan_language', action.payload);
            localStorage.setItem('kisaan_language_selected', 'true');
            state.isLanguageSelected = true;
            state.showLanguagePopup = false;

            // Sync with i18n
            if (typeof window !== 'undefined') {
                import('../../i18n').then(({ syncLanguageWithRedux }) => {
                    syncLanguageWithRedux(action.payload);
                });
            }
        },
        closeLanguagePopup: (state) => {
            state.showLanguagePopup = false;
            if (!state.isLanguageSelected) {
                // If user closes popup without selecting, default to English
                state.currentLanguage = 'en';
                localStorage.setItem('kisaan_language', 'en');
                localStorage.setItem('kisaan_language_selected', 'true');
                state.isLanguageSelected = true;

                // Sync with i18n
                if (typeof window !== 'undefined') {
                    import('../../i18n').then(({ syncLanguageWithRedux }) => {
                        syncLanguageWithRedux('en');
                    });
                }
            }
        },
        showLanguagePopup: (state) => {
            state.showLanguagePopup = true;
        }
    }
});

export const { setLanguage, closeLanguagePopup, showLanguagePopup } = languageSlice.actions;

export default languageSlice.reducer;
