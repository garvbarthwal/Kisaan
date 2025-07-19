import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../redux/slices/languageSlice';
import axiosInstance from '../utils/axiosConfig';

/**
 * Hook to sync user's preferred language with i18n and save to backend
 */
export const useLanguageSync = () => {
    const { user } = useSelector((state) => state.auth);
    const { currentLanguage } = useSelector((state) => state.language);
    const { i18n } = useTranslation();
    const dispatch = useDispatch();

    // Sync user's preferred language on login
    useEffect(() => {
        if (user?.preferredLanguage && user.preferredLanguage !== currentLanguage) {
            dispatch(setLanguage(user.preferredLanguage));
            i18n.changeLanguage(user.preferredLanguage);
        }
    }, [user?.preferredLanguage, dispatch, i18n]);

    // Update backend when language changes (only for logged-in users)
    useEffect(() => {
        const updateUserLanguage = async () => {
            if (user && currentLanguage && currentLanguage !== user.preferredLanguage) {
                try {
                    await axiosInstance.put('/api/users/language', {
                        language: currentLanguage
                    });

                    // Update the user object in localStorage
                    const updatedUser = { ...user, preferredLanguage: currentLanguage };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                } catch (error) {
                    console.error('Failed to update preferred language:', error);
                }
            }
        };

        // Only update if user is logged in and language has actually changed
        if (user && currentLanguage) {
            updateUserLanguage();
        }
    }, [currentLanguage, user]);

    return {
        currentLanguage,
        userPreferredLanguage: user?.preferredLanguage
    };
};

export default useLanguageSync;
