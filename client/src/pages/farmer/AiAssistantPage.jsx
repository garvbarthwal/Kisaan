import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    askFarmingQuery,
    getSupportedLanguages,
    getSampleQueries,
    clearError,
    setListeningState,
    setSpeakingState,
    setVoiceTranscript,
    speechToText,
    textToSpeech,
    markConversationSpeechReady,
    markConversationDisplayReady
} from "../../redux/slices/aiSlice";
import Loader from "../../components/Loader";
import VoiceSettingsModal from "../../components/VoiceSettingsModal";
import useVoiceInput from "../../hooks/useVoiceInput";
import ttsService from "../../utils/textToSpeech";
import {
    FaMicrophone,
    FaMicrophoneSlash,
    FaPaperPlane,
    FaRobot,
    FaUser,
    FaHistory,
    FaLeaf,
    FaLightbulb,
    FaTimes,
    FaBars,
    FaCog,
    FaStop,
    FaVolumeUp,
    FaSpinner,
    FaWaveSquare,
    FaBox
} from "react-icons/fa";

const AiAssistantPage = () => {
    const dispatch = useDispatch();
    const {
        conversations,
        supportedLanguages,
        sampleQueries: apiSampleQueries,
        queryLoading,
        error,
        voiceSettings,
        isListening: reduxIsListening,
        isSpeaking: reduxIsSpeaking
    } = useSelector((state) => state.ai);

    // Get the global language from the language slice
    const { currentLanguage: selectedLanguage } = useSelector((state) => state.language);

    const [query, setQuery] = useState("");
    const [recognition, setRecognition] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [showVoiceSettings, setShowVoiceSettings] = useState(false);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const currentSpeechRef = useRef(null);

    // Enhanced voice input hook
    const {
        isListening,
        transcript,
        interimTranscript,
        isSupported: voiceSupported,
        startListening,
        stopListening,
        toggleListening,
        resetTranscript,
        cancelAutoSend
    } = useVoiceInput({
        language: selectedLanguage,
        autoSendOnEnd: voiceSettings.autoSendOnVoiceEnd,
        autoSendDelay: voiceSettings.voiceEndDelay || 1500,
        onStart: () => {
            // Stop any current speech when starting to listen
            if (ttsService.isSpeaking()) {
                ttsService.stop();
                dispatch(setSpeakingState(false));
            }
            dispatch(setVoiceTranscript(''));
        },
        onResult: (text, type) => {
            if (type === 'final') {
                setQuery(text);
                dispatch(setVoiceTranscript(text));
            } else if (type === 'interim') {
                // Show interim results in real-time
                dispatch(setVoiceTranscript(text));
            }
        },
        onEnd: (text, autoSend) => {
            dispatch(setListeningState(false));
            if (autoSend && text.trim()) {
                // Auto-send the message
                handleSubmitVoice(text.trim());
            }
        },
        onError: (error) => {
            dispatch(setListeningState(false));
            console.error('Voice input error:', error);

            // Show user-friendly error message
            if (error === 'not-allowed') {
                alert('Microphone access denied. Please allow microphone access and try again.');
            } else if (error === 'no-speech') {
                // This is normal when user doesn't speak, don't show error
            } else {
                console.error('Voice recognition error:', error);
            }
        },
        continuous: false,
        interimResults: true
    });

    // Update Redux state when listening state changes
    useEffect(() => {
        dispatch(setListeningState(isListening));
    }, [isListening, dispatch]);

    // Handle automatic speech synthesis for AI responses
    useEffect(() => {
        const processResponseForSpeech = async (conversation) => {
            if (!conversation || conversation.speechReady) return;

            try {
                // Use speechAnswer if available, otherwise use answer
                const textForSpeech = conversation.speechAnswer || conversation.answer;

                // Generate smart speech text first
                const processedText = await ttsService.generateSmartSpeechText(textForSpeech, selectedLanguage);

                // Mark conversation as speech ready with processed text
                dispatch(markConversationSpeechReady({
                    conversationId: conversation.id,
                    processedText: processedText
                }));

                // Start speaking if auto-speak is enabled
                if (voiceSettings.autoSpeak && !currentSpeechRef.current) {
                    currentSpeechRef.current = conversation.id;
                    dispatch(setSpeakingState(true));

                    await ttsService.speak(processedText, selectedLanguage, {
                        rate: voiceSettings.speechRate,
                        pitch: voiceSettings.speechPitch,
                        volume: voiceSettings.speechVolume
                    });

                    dispatch(setSpeakingState(false));
                    currentSpeechRef.current = null;
                }
            } catch (error) {
                console.error('Speech processing error:', error);
                // Mark as ready even if processing fails
                dispatch(markConversationSpeechReady({
                    conversationId: conversation.id,
                    processedText: conversation.speechAnswer || conversation.answer
                }));
            }
        };

        // Process the latest conversation if it's not speech ready
        if (conversations.length > 0) {
            const latestConversation = conversations[0];
            if (latestConversation && !latestConversation.speechReady) {
                processResponseForSpeech(latestConversation);
            }
        }
    }, [conversations, voiceSettings, selectedLanguage, dispatch]);

    // Stop speech when component unmounts or language changes
    useEffect(() => {
        return () => {
            if (ttsService.isSpeaking()) {
                ttsService.stop();
                dispatch(setSpeakingState(false));
            }
        };
    }, [selectedLanguage, dispatch]);

    // Sample queries for suggestions - will be fetched from API
    const sampleQueries = [
        {
            en: "What is the best time to plant rice in monsoon season?",
            hi: "मानسून में धान बोने का सबसे अच्छा समय कौन सा है?",
            category: "Seasonal Farming"
        },
        {
            en: "How much wheat do I have in stock?",
            hi: "मेरे पास कितना गेहूं स्टॉक में है?",
            category: "Stock Management"
        },
        {
            en: "Show me all my inventory",
            hi: "मेरा सारा स्टॉक दिखाएं",
            category: "Stock Management"
        },
        {
            en: "Reduce mango stock by 2 kg",
            hi: "आम का स्टॉक 2 किलो कम करें",
            bn: "আম স্টক ২ কেজি কমান",
            te: "మామిడి స्টाక్‌ను 2 కిలోలు తగ్గించండి",
            mr: "आंब्याचा साठा 2 किलो कमी करा",
            ta: "மாம்பழ ஸ்டாக்கை 2 கிலோ குறைக்கவும்",
            gu: "કેરીનો સ્ટોક 2 કિલો ઘટાડો",
            kn: "ಮಾವಿನ ಸ್ಟಾಕ್ ಅನ್ನು 2 ಕಿಲೋ ಕಡಿಮೆ ಮಾಡಿ",
            ml: "മാമ്പഴ സ്റ്റോക്ക് 2 കിലോ കുറയ്ക്കുക",
            pa: "ਅੰਬ ਦਾ ਸਟਾਕ 2 ਕਿਲੋ ਘਟਾਓ",
            or: "ଆମ୍ବ ଷ୍ଟକ୍ 2 କିଲୋ କମ୍ କରନ୍ତୁ",
            as: "আম ষ্টক ২ কিলো কমাওক",
            ur: "آم کا اسٹاک 2 کلو کم کریں",
            category: "Inventory Management",
            category_hi: "स्टॉक प्रबंधन",
            category_bn: "স্টক ব্যবস্থাপনা",
            category_te: "స्टाक్ నిర్వహణ",
            category_mr: "साठा व्यवस्थापन",
            category_ta: "இருப்பு மேলாண்மை",
            category_gu: "સ્ટોક મેનેજમેન્ટ",
            category_kn: "ಸ್ಟಾಕ್ ನಿರ್ವಹಣೆ",
            category_ml: "സ്റ്റോക്ക് മാനേജ്മെന്റ്",
            category_pa: "ਸਟਾਕ ਪ੍ਰਬੰਧਨ",
            category_or: "ଷ୍ଟକ୍ ପରିଚାଳନା",
            category_as: "ষ্টক ব্যৱস্থাপনা",
            category_ur: "اسٹاک مینجمنٹ"
        },
        {
            en: "Add 5 kg harvested tomatoes to inventory",
            hi: "5 किलो काटे गए टमाटर स्टॉक में जोड़ें",
            bn: "5 কেজি কাটা টমেটো স্টকে যোগ করুন",
            te: "5 కిలోల కోసిన టమాటాలను स्टाक్‌లో జోడించండి",
            mr: "5 किलो कापलेले टोमॅटो साठ्यात जोडा",
            ta: "5 கிலோ அறுவடை செய்த தக்காளியை ஸ்டாக்கில் சேர்க்கவும்",
            gu: "5 કિલો કાપેલા ટમેટા સ્ટોકમાં ઉમેરો",
            kn: "5 ಕಿಲೋ ಕೊಯ್ದ ಟೊಮೇಟೊಗಳನ್ನು ಸ್ಟಾಕ್‌ಗೆ ಸೇರಿಸಿ",
            ml: "5 കിലോ കൊയ്ത തക്കാളി സ്റ്റോക്കിൽ ചേർക്കുക",
            pa: "5 ਕਿਲੋ ਕਟੇ ਟਮਾਟਰ ਸਟਾਕ ਵਿੱਚ ਜੋੜੋ",
            or: "5 କିଲୋ କଟା ଟମାଟୋ ଷ୍ଟକରେ ଯୋଗ କରନ୍ତୁ",
            as: "5 কিলো কটা টমেটো ষ্টকত যোগ কৰক",
            ur: "5 کلو کاٹے گئے ٹماٹر اسٹاک میں شامل کریں",
            category: "Inventory Management"
        },
        {
            en: "I sold 3 kg onions, update my stock",
            hi: "मैंने 3 किलो प्याज बेचे, मेरा स्टॉक अपडेट करें",
            bn: "আমি 3 কেজি পেঁয়াজ বিক্রি করেছি, আমার স্টক আপডেট করুন",
            te: "నేను 3 కిలోల ఉల్లిపాయలు అమ్మాను, నా స्టाక్‌ను అప్‌డేట్ చేయండి",
            mr: "मी 3 किलो कांदे विकले, माझा साठा अद्ययावत करा",
            ta: "நான் 3 கிலோ வெங்காயம் விற்றேன், எனது ஸ்டாக்கை புதுப்பிக்கவும்",
            gu: "મેં 3 કિલો ડુંગળી વેચ્યા, મારો સ્ટોક અપડેટ કરો",
            kn: "ನಾನು 3 ಕಿಲೋ ಈರುಳ್ಳಿ ಮಾರಿದೆ, ನನ್ನ ಸ್ಟಾಕ್ ಅಪ್‌ಡೇಟ್ ಮಾಡಿ",
            ml: "ഞാൻ 3 കിലോ ഉള്ളി വിറ്റു, എന്റെ സ്റ്റോക്ക് അപ്ഡേറ്റ് ചെയ്യുക",
            pa: "ਮੈਂ 3 ਕਿਲੋ ਪਿਆਜ਼ ਵੇਚੇ, ਮੇਰਾ ਸਟਾਕ ਅਪਡੇਟ ਕਰੋ",
            or: "ମୁଁ 3 କିଲୋ ପିଆଜ ବିକ୍ରି କଲି, ମୋର ଷ୍ଟକ୍ ଅପଡେଟ୍ କରନ୍ତୁ",
            as: "মই 3 কিলো পিয়াজ বিক্ৰী কৰিলোঁ, মোৰ ষ্টক আপডেট কৰক",
            ur: "میں نے 3 کلو پیاز بیچے، میرا اسٹاک اپڈیٹ کریں",
            category: "Inventory Management"
        },
        {
            en: "How to control pest attacks on tomato plants?",
            hi: "टमाटर के पौधों पर कीट हमले को कैसे नियंत्रित करें?",
            bn: "টমেটো গাছে পোকা আক্রমণ নিয়ন্ত্রণ করবেন কীভাবে?",
            te: "టమోటా మొక్కలపై తెగుళ్ల దాడిని ఎలా నియంత్రించాలి?",
            mr: "टोमॅटोच्या रोपांवरील कीटकांचा हल्ला कसा नियंत्रित करावा?",
            ta: "தக்காளி செடிகளில் பூச்சி தாக்குதலை எவ்வாறு கட்டுப்படுத்துவது?",
            gu: "ટામેટાના છોડ પર જીવાતનો હુમલો કેવી રીતે નિયંત્રિત કરવો?",
            kn: "ಟೊಮೆಟೊ ಸಸ್ಯಗಳ ಮೇಲೆ ಕೀಟಗಳ ದಾಳಿಯನ್ನು ಹೇಗೆ ನಿಯಂತ್ರಿಸುವುದು?",
            ml: "തക്കാളി ചെടികളിലെ കീടബാധ എങ്ങനെ നിയന്ത്രിക്കാം?",
            pa: "ਟਮਾਟਰ ਦੇ ਪੌਦਿਆਂ 'ਤੇ ਕੀੜਿਆਂ ਦੇ ਹਮਲਿਆਂ ਨੂੰ ਕਿਵੇਂ ਕੰਟਰੋਲ ਕਰੀਏ?",
            or: "ଟମାଟୋ ଗଛରେ କୀଟ ଆକ୍ରମଣକୁ କିପରି ନିୟନ୍ତ୍ରଣ କରିବେ?",
            as: "বিলাহী গছত কীট-পতংগৰ আক্ৰমণ কেনেকৈ নিয়ন্ত্ৰণ কৰিব?",
            ur: "ٹماٹر کے پودوں پر کیڑوں کے حملوں کو کیسے کنٹرول کیا جائے؟",
            category: "Pest Control",
            category_hi: "कीट नियंत्रण",
            category_bn: "কীট নিয়ন্ত্রণ",
            category_te: "తెగులు నియంత్రణ",
            category_mr: "कीटक नियंत्रण",
            category_ta: "பூச்சி கட்டுப்பாடு",
            category_gu: "જીવાત નિયંત્રણ",
            category_kn: "ಕೀಟ ನಿಯಂತ್ರಣ",
            category_ml: "കീടനിയന്ത്രണം",
            category_pa: "ਕੀਟ ਕੰਟਰੋਲ",
            category_or: "କୀଟ ନିୟନ୍ତ୍ରଣ",
            category_as: "কীট নিয়ন্ত্রণ",
            category_ur: "کیڑوں پর قابو"
        },
        {
            en: "What are the government subsidies available for organic farming?",
            hi: "जैविक खेती के लिए कौन सी सरकारी सब्सिडी उपलब्ध है?",
            bn: "জৈব চাষের জন্য কী কী সরকারি ভর্তুকি পাওয়া যায়?",
            te: "సేంద్రీయ వ్యవసాయం కోసం అందుబాటులో ఉన్న ప్రభుత్వ రాయితీలు ఏమిటి?",
            mr: "सेंद्रिय शेतीसाठी कोणत्या सरकारी सबसिडी उपलब्ध आहेत?",
            ta: "இயற்கை விவசாயத்திற்கு கிடைக்கும் அரசு மானியங்கள் என்னென்ன?",
            gu: "ઓર્ગેનિક ખેતી માટે કઈ સરકારી સબસિડી ઉપલબ્ધ છે?",
            kn: "ಸಾವಯವ ಕೃಷಿಗಾಗಿ ಲಭ್ಯವಿರುವ ಸರ್ಕಾರಿ ಸಬ್ಸಿಡಿಗಳು ಯಾವುವು?",
            ml: "ജൈവകൃഷിക്കായി ലഭ്യമായ സർക്കാർ സബ്സിഡികൾ ഏതൊക്കെയാണ്?",
            pa: "ਜੈਵਿਕ ਖੇਤੀ ਲਈ ਕਿਹੜੀਆਂ ਸਰਕਾਰੀ ਸਬਸਿਡੀਆਂ ਉਪਲਬਧ ਹਨ?",
            or: "ଜୈବିକ ଚାଷ ପାଇଁ କେଉଁ ସରକାରୀ ସବସିଡି ଉପଲବ୍ଧ?",
            as: "জৈৱিক খেতিৰ বাবে কি কি চৰকাৰী ৰাজসাহায্য উপলব্ধ?",
            ur: "نامیاتی کاشتکاری کے لیے کون سی سرکاری سبسڈی دستیاب ہیں؟",
            category: "Government Schemes",
            category_hi: "सरकारी योजनाएँ",
            category_bn: "সরকারি প্রকল্প",
            category_te: "ప్రభుత్వ పథకాలు",
            category_mr: "सरकारी योजना",
            category_ta: "அரசு திட்டங்கள்",
            category_gu: "સરકારી યોજનાઓ",
            category_kn: "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು",
            category_ml: "സർക്കാർ പദ്ധതികൾ",
            category_pa: "ਸਰਕਾਰੀ ਸਕੀਮਾਂ",
            category_or: "ସରକାରୀ ଯୋଜନା",
            category_as: "চৰকাৰী আঁচনিসমূহ",
            category_ur: "سرکاری اسکیمیں"
        },
        {
            en: "Best irrigation methods for water conservation",
            hi: "पानी के संरक्षण के लिए सबसे अच्छी सिंचाई विधियां",
            bn: "জল সংরক্ষণের জন্য সেরা সেচ পদ্ধতি",
            te: "నీటి సంరక్షణకు ఉత్తమ నీటిపారుదల పద్ధతులు",
            mr: "पाण्याच्या संवर्धनासाठी सर्वोत्तम सिंचन पद्धती",
            ta: "நீர் பாதுகாப்புக்கான சிறந்த நீர்ப்பாசன முறைகள்",
            gu: "પાણીના સંરક્ષણ માટે શ્રેષ્ઠ સિંચાઈ પદ્ધતિઓ",
            kn: "ನೀರಿನ ಸಂರಕ್ಷಣೆಗಾಗಿ ಉತ್ತಮ ನೀರಾವರಿ ವಿಧಾನಗಳು",
            ml: "ജലസംരക്ഷണത്തിനുള്ള മികച്ച ജലസേചന രീതികൾ",
            pa: "ਪਾਣੀ ਦੀ ਸੰਭਾਲ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਸਿੰਚਾਈ ਵਿਧੀਆਂ",
            or: "ଜଳ ସଂରକ୍ଷଣ ପାଇଁ ସର୍ବୋତ୍ତମ ଜଳସେଚନ ପଦ୍ଧତିଗୁଡ଼ିକ",
            as: "পানী সংৰক্ষণৰ বাবে শ্ৰেষ্ঠ জলসিঞ্চন পদ্ধতিসমূহ",
            ur: "پانی کے تحفظ کے لیے بہترین آبپاشی کے طریقے",
            category: "Water Management",
            category_hi: "जल प्रबंधन",
            category_bn: "জল ব্যবস্থাপনা",
            category_te: "నీటి నిర్వహణ",
            category_mr: "जल व्यवस्थापन",
            category_ta: "நீர் மேலாண்மை",
            category_gu: "જળ વ્યવસ્થાપન",
            category_kn: "ಜಲ ನಿರ್ವಹಣೆ",
            category_ml: "ജല പരിപാലനം",
            category_pa: "ਪਾਣੀ ਪ੍ਰਬੰਧਨ",
            category_or: "ଜଳ ପରିଚାଳନା",
            category_as: "জল ব্যৱস্থাপনা",
            category_ur: "آبی انتظام"
        }
    ];

    useEffect(() => {
        dispatch(getSupportedLanguages());
        dispatch(getSampleQueries());
    }, [dispatch, selectedLanguage]);

    // Auto-scroll to bottom when new messages arrive (only scroll the chat container)
    useEffect(() => {
        if (messagesEndRef.current && chatContainerRef.current) {
            // Use setTimeout to ensure DOM is updated before scrolling
            const scrollToBottom = () => {
                messagesEndRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "end",
                    inline: "nearest"
                });
            };

            // Immediate scroll for better UX
            scrollToBottom();

            // Delayed scroll to ensure content is fully rendered
            setTimeout(scrollToBottom, 100);
        }
    }, [conversations, queryLoading]);

    // Close sidebar when clicking outside on mobile
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showSidebar && !event.target.closest('.sidebar-content') && !event.target.closest('.mobile-menu-btn')) {
                setShowSidebar(false);
            }
        };

        if (showSidebar) {
            document.addEventListener('click', handleClickOutside);
            // Prevent body scroll on mobile when sidebar is open
            document.body.classList.add('sidebar-open');
            return () => {
                document.removeEventListener('click', handleClickOutside);
                document.body.classList.remove('sidebar-open');
            };
        } else {
            document.body.classList.remove('sidebar-open');
        }
    }, [showSidebar]);

    const getLanguageCode = (langCode) => {
        const languageMap = {
            'hi': 'hi-IN',
            'bn': 'bn-IN',
            'te': 'te-IN',
            'mr': 'mr-IN',
            'ta': 'ta-IN',
            'gu': 'gu-IN',
            'kn': 'kn-IN',
            'ml': 'ml-IN',
            'pa': 'pa-IN',
            'or': 'or-IN',
            'as': 'as-IN',
            'ur': 'ur-PK',
            'en': 'en-IN'
        };
        return languageMap[langCode] || 'en-IN';
    };

    const handleVoiceInput = () => {
        if (!voiceSupported) {
            alert("Speech recognition is not supported in your browser");
            return;
        }

        // Stop any current speech before starting to listen
        if (ttsService.isSpeaking()) {
            ttsService.stop();
            dispatch(setSpeakingState(false));
        }

        toggleListening();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        submitQuery(query.trim());
        setQuery("");
    };

    const handleSubmitVoice = (voiceQuery) => {
        if (!voiceQuery.trim()) return;
        submitQuery(voiceQuery.trim());
        resetTranscript();
    };

    const submitQuery = (queryText) => {
        const queryData = {
            query: queryText,
            language: selectedLanguage
        };

        dispatch(askFarmingQuery(queryData))
            .unwrap()
            .then(() => {
                // Success handled by the speech effect
            })
            .catch(() => {
                // Error is handled by the slice
            });
    };

    const handleStopSpeech = () => {
        if (ttsService.isSpeaking()) {
            ttsService.stop();
            dispatch(setSpeakingState(false));
            currentSpeechRef.current = null;
        }
    };

    const handleSampleQuery = (sampleQuery) => {
        const queryText = selectedLanguage === 'en' ? sampleQuery.en : (sampleQuery[selectedLanguage] || sampleQuery.en);
        setQuery(queryText);
    };

    const getSelectedLanguageName = () => {
        const languageNames = {
            'en': 'English',
            'hi': 'हिंदी',
            'bn': 'বাংলা',
            'te': 'తెలుగు',
            'mr': 'मराठी',
            'ta': 'தமிழ்',
            'gu': 'ગુજરાતી',
            'kn': 'ಕನ್ನಡ',
            'ml': 'മലയാളം',
            'pa': 'ਪੰਜਾਬੀ',
            'or': 'ଓଡ଼ିଆ',
            'as': 'অসমীয়া',
            'ur': 'اردو'
        };
        return languageNames[selectedLanguage] || 'English';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                        <FaRobot className="text-white text-sm" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800">AI Assistant</h1>
                    </div>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowSidebar(!showSidebar);
                    }}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors mobile-menu-btn"
                >
                    <FaBars className="text-lg" />
                </button>
            </div>

            <div className="flex h-screen lg:h-auto lg:min-h-screen">
                {/* Sidebar */}
                <div className={`
                    fixed lg:relative top-0 left-0 h-full lg:h-auto
                    w-80 lg:w-72 xl:w-80 bg-white shadow-lg lg:shadow-none
                    transform transition-transform duration-300 ease-in-out z-40
                    ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    lg:block border-r border-gray-200 sidebar-content
                `}>
                    {/* Mobile close button */}
                    <div className="lg:hidden flex items-center justify-between p-4 border-b">
                        <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
                        <button
                            onClick={() => setShowSidebar(false)}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    <div className="p-4 space-y-4 h-full overflow-y-auto custom-scrollbar">
                        {/* Desktop Header */}
                        <div className="hidden lg:block mb-6">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                                    <FaRobot className="text-white text-lg" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-800">AI Assistant</h1>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600">Get expert farming advice in your language</p>
                        </div>

                        {/* Sample Queries */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h3 className="font-semibold mb-3 flex items-center text-sm">
                                <FaLightbulb className="mr-2 text-yellow-500" />
                                Quick Queries
                            </h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                                {(apiSampleQueries.length > 0 ? apiSampleQueries : sampleQueries).map((sample, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            handleSampleQuery(sample);
                                            setShowSidebar(false);
                                        }}
                                        className="w-full p-3 text-left text-xs bg-white hover:bg-green-50 rounded-lg transition-colors border border-gray-200 hover:border-green-300"
                                    >
                                        <div className="font-medium text-green-600 text-xs mb-1">
                                            {sample[`category_${selectedLanguage}`] || sample.category}
                                        </div>
                                        <div className="text-gray-700 line-clamp-3 leading-relaxed">
                                            {selectedLanguage === 'en' ? sample.en : (sample[selectedLanguage] || sample.en)}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* History Toggle */}
                        <button
                            onClick={() => {
                                setShowHistory(!showHistory);
                                if (!showHistory) setShowSidebar(false);
                            }}
                            className="w-full bg-gray-50 rounded-xl p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                        >
                            <span className="flex items-center font-semibold text-sm">
                                <FaHistory className="mr-2 text-blue-500" />
                                History
                            </span>
                            <span className="text-gray-400 text-xs">{showHistory ? '▼' : '▶'}</span>
                        </button>
                    </div>
                </div>

                {/* Overlay for mobile */}
                {showSidebar && (
                    <div
                        className="lg:hidden fixed inset-0 bg-black bg-opacity-40 z-30 sidebar-overlay"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowSidebar(false);
                        }}
                    />
                )}

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-white lg:mt-0 lg:ml-0">
                    <div className="flex-1 flex flex-col h-screen lg:h-auto lg:min-h-[calc(100vh-2rem)] lg:m-4 lg:rounded-xl lg:shadow-md lg:border overflow-hidden">
                        {/* Chat Messages */}
                        <div
                            ref={chatContainerRef}
                            className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-3 lg:space-y-4 bg-gray-50 lg:bg-white chat-container"
                            style={{
                                paddingTop: '1rem',
                                paddingBottom: '1rem',
                                maxHeight: 'calc(100vh - 200px)',
                                scrollBehavior: 'smooth'
                            }}
                        >
                            {conversations.length === 0 ? (
                                <div className="text-center py-8 lg:py-12">
                                    <FaLeaf className="text-green-500 text-4xl lg:text-5xl mx-auto mb-4" />
                                    <h3 className="text-lg lg:text-xl font-semibold text-gray-700 mb-2">
                                        Welcome to AI Farming Assistant
                                    </h3>
                                    <p className="text-gray-500 mb-4 text-sm lg:text-base px-4">
                                        Ask any farming-related question in your preferred language
                                    </p>
                                    <div className="text-xs lg:text-sm text-gray-400 px-4">
                                        You can type your question or use the microphone to speak
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {conversations.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map((conversation, index) => (
                                        <div key={index} className="space-y-3 lg:space-y-4 chat-message-enter">
                                            {/* User Message */}
                                            <div className="flex justify-end">
                                                <div className="max-w-[85%] lg:max-w-md xl:max-w-lg">
                                                    <div className="bg-green-500 text-white p-3 lg:p-4 rounded-2xl rounded-br-md shadow-sm">
                                                        <div className="flex items-start space-x-2">
                                                            <FaUser className="text-xs mt-1 flex-shrink-0 opacity-80" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm lg:text-base break-words">{conversation.query}</p>
                                                                <p className="text-xs text-green-100 mt-1">
                                                                    {new Date(conversation.timestamp).toLocaleTimeString([], {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* AI Response */}
                                            <div className="flex justify-start">
                                                <div className="max-w-[90%] lg:max-w-2xl xl:max-w-3xl">
                                                    <div className="bg-white lg:bg-gray-100 border lg:border-0 p-3 lg:p-4 rounded-2xl rounded-bl-md shadow-sm">
                                                        <div className="flex items-start space-x-2 lg:space-x-3">
                                                            <div className="w-6 h-6 lg:w-7 lg:h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                <FaRobot className="text-green-500 text-xs lg:text-sm" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                {conversation.speechReady && conversation.displayReady ? (
                                                                    <div className="space-y-3">
                                                                        {/* Display detailed response if available */}
                                                                        {conversation.hasDisplayData && conversation.type === 'stock_query' && typeof conversation.displayAnswer === 'object' ? (
                                                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                                                <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                                                                                    <FaLeaf className="mr-2" />
                                                                                    {conversation.displayAnswer.summary}
                                                                                </h4>

                                                                                {conversation.displayAnswer.products.length > 0 ? (
                                                                                    <div className="space-y-3">
                                                                                        {/* Product List */}
                                                                                        <div className="grid gap-3">
                                                                                            {conversation.displayAnswer.products.map((product, index) => (
                                                                                                <div key={index} className="bg-white rounded-lg p-3 border border-green-100">
                                                                                                    <div className="flex justify-between items-start mb-2">
                                                                                                        <div>
                                                                                                            <h5 className="font-medium text-gray-800 flex items-center">
                                                                                                                {product.name}
                                                                                                                {product.isOrganic && (
                                                                                                                    <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                                                                                                                        Organic
                                                                                                                    </span>
                                                                                                                )}
                                                                                                            </h5>
                                                                                                            <p className="text-sm text-gray-600">{product.category}</p>
                                                                                                        </div>
                                                                                                        <div className="text-right">
                                                                                                            <p className="font-semibold text-green-600">{product.totalValueFormatted}</p>
                                                                                                            <p className="text-xs text-gray-500">Total Value</p>
                                                                                                        </div>
                                                                                                    </div>

                                                                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                                                                        <div>
                                                                                                            <p className="text-gray-600">Quantity</p>
                                                                                                            <p className="font-medium">{product.quantity} {product.unit}</p>
                                                                                                        </div>
                                                                                                        <div>
                                                                                                            <p className="text-gray-600">Price per {product.unit}</p>
                                                                                                            <p className="font-medium">{product.priceFormatted}</p>
                                                                                                        </div>
                                                                                                    </div>

                                                                                                    {product.harvestDateFormatted && (
                                                                                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                                                                                            <p className="text-xs text-gray-600">
                                                                                                                Harvested on {product.harvestDateFormatted}
                                                                                                                {product.daysSinceHarvest !== null && (
                                                                                                                    <span className="ml-1">({product.daysSinceHarvest} days ago)</span>
                                                                                                                )}
                                                                                                            </p>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>

                                                                                        {/* Summary Statistics */}
                                                                                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                                                            <h6 className="font-medium text-gray-800 mb-2">Summary</h6>
                                                                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                                                                                <div className="text-center">
                                                                                                    <p className="font-semibold text-blue-600">{conversation.displayAnswer.totals.productCount}</p>
                                                                                                    <p className="text-gray-600">Products</p>
                                                                                                </div>
                                                                                                <div className="text-center">
                                                                                                    <p className="font-semibold text-green-600">{conversation.displayAnswer.totals.totalQuantity}</p>
                                                                                                    <p className="text-gray-600">Total Items</p>
                                                                                                </div>
                                                                                                <div className="text-center">
                                                                                                    <p className="font-semibold text-purple-600">{conversation.displayAnswer.totals.totalValueFormatted}</p>
                                                                                                    <p className="text-gray-600">Total Value</p>
                                                                                                </div>
                                                                                                <div className="text-center">
                                                                                                    <p className="font-semibold text-orange-600">{conversation.displayAnswer.totals.organicPercentage}%</p>
                                                                                                    <p className="text-gray-600">Organic</p>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <p className="text-gray-600 italic">{conversation.displayAnswer.message}</p>
                                                                                )}
                                                                            </div>
                                                                        ) : conversation.hasDisplayData && conversation.type === 'inventory_update' && conversation.updateSuccess && conversation.displayAnswer.product ? (
                                                                            /* Inventory Update Success Display */
                                                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                                                <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                                                                                    <FaBox className="mr-2" />
                                                                                    Inventory Updated Successfully
                                                                                </h4>

                                                                                <div className="bg-white rounded-lg p-3 border border-blue-100">
                                                                                    <div className="flex justify-between items-start mb-3">
                                                                                        <div>
                                                                                            <h5 className="font-medium text-gray-800">{conversation.displayAnswer.product.name}</h5>
                                                                                        </div>
                                                                                        <div className="text-right">
                                                                                            <p className="font-semibold text-blue-600">₹{conversation.displayAnswer.product.currentValue}</p>
                                                                                            <p className="text-xs text-gray-500">Current Value</p>
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                                                                                        <div className="text-center">
                                                                                            <p className="text-gray-600">Previous</p>
                                                                                            <p className="font-medium text-gray-800">{conversation.displayAnswer.product.oldQuantity} {conversation.displayAnswer.product.unit}</p>
                                                                                        </div>
                                                                                        <div className="text-center">
                                                                                            <p className="text-gray-600">Change</p>
                                                                                            <p className={`font-medium ${conversation.displayAnswer.product.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                                                {conversation.displayAnswer.product.change >= 0 ? '+' : ''}{conversation.displayAnswer.product.change} {conversation.displayAnswer.product.unit}
                                                                                            </p>
                                                                                        </div>
                                                                                        <div className="text-center">
                                                                                            <p className="text-gray-600">Current</p>
                                                                                            <p className="font-medium text-blue-600">{conversation.displayAnswer.product.newQuantity} {conversation.displayAnswer.product.unit}</p>
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="pt-2 border-t border-gray-100">
                                                                                        <p className="text-xs text-gray-600">
                                                                                            Price: ₹{conversation.displayAnswer.product.price} per {conversation.displayAnswer.product.unit}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ) : conversation.hasDisplayData && conversation.type === 'disambiguation_needed' && conversation.displayAnswer.products ? (
                                                                            /* Product Disambiguation Display */
                                                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                                                <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
                                                                                    <FaLightbulb className="mr-2" />
                                                                                    Multiple Products Found
                                                                                </h4>

                                                                                <p className="text-sm text-gray-700 mb-3">
                                                                                    Please specify which product you want to update:
                                                                                </p>

                                                                                <div className="grid gap-2">
                                                                                    {conversation.displayAnswer.products.map((product, index) => (
                                                                                        <div key={index} className="bg-white rounded-lg p-3 border border-yellow-100 flex justify-between items-center">
                                                                                            <div>
                                                                                                <h5 className="font-medium text-gray-800">{product.name}</h5>
                                                                                                <p className="text-sm text-gray-600">₹{product.price} per {product.unit}</p>
                                                                                            </div>
                                                                                            <div className="text-right">
                                                                                                <p className="font-medium text-gray-800">{product.quantity} {product.unit}</p>
                                                                                                <p className="text-xs text-gray-500">Available</p>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            /* Regular detailed text response */
                                                                            <div className="prose prose-sm max-w-none">
                                                                                <p className="text-sm lg:text-base text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                                                                                    {typeof conversation.displayAnswer === 'string'
                                                                                        ? conversation.displayAnswer
                                                                                        : conversation.displayAnswer?.message
                                                                                        || conversation.processedAnswer
                                                                                        || conversation.answer}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center space-x-2">
                                                                        <div className="flex space-x-1">
                                                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                                                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                                        </div>
                                                                        <p className="text-sm lg:text-base text-gray-600 italic">
                                                                            Preparing response...
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center justify-between mt-2">
                                                                    <p className="text-xs text-gray-500">
                                                                        AI Assistant
                                                                        {reduxIsSpeaking && currentSpeechRef.current === conversation.id && (
                                                                            <span className="ml-2 flex items-center text-green-500">
                                                                                <FaVolumeUp className="mr-1 animate-pulse" />
                                                                                Speaking...
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                    <div className="flex items-center space-x-2">
                                                                        {/* Manual Voice Control - only show if speech is ready */}
                                                                        {conversation.speechReady && (
                                                                            <button
                                                                                onClick={async () => {
                                                                                    if (reduxIsSpeaking && currentSpeechRef.current === conversation.id) {
                                                                                        handleStopSpeech();
                                                                                    } else {
                                                                                        currentSpeechRef.current = conversation.id;
                                                                                        dispatch(setSpeakingState(true));

                                                                                        try {
                                                                                            // Use processed text if available, otherwise generate it
                                                                                            let textToSpeak = conversation.processedAnswer;
                                                                                            if (!textToSpeak) {
                                                                                                const sourceText = conversation.speechAnswer || conversation.answer;
                                                                                                textToSpeak = await ttsService.generateSmartSpeechText(sourceText, selectedLanguage);
                                                                                            }

                                                                                            await ttsService.speak(textToSpeak, selectedLanguage, {
                                                                                                rate: voiceSettings.speechRate,
                                                                                                pitch: voiceSettings.speechPitch,
                                                                                                volume: voiceSettings.speechVolume
                                                                                            });
                                                                                        } catch (error) {
                                                                                            console.error('TTS Error:', error);
                                                                                        } finally {
                                                                                            dispatch(setSpeakingState(false));
                                                                                            currentSpeechRef.current = null;
                                                                                        }
                                                                                    }
                                                                                }}
                                                                                className={`p-1 rounded-full transition-colors ${reduxIsSpeaking && currentSpeechRef.current === conversation.id
                                                                                    ? 'text-red-500 hover:text-red-600 bg-red-50'
                                                                                    : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                                                                                    }`}
                                                                                title={reduxIsSpeaking && currentSpeechRef.current === conversation.id ? "Stop speaking" : "Read aloud"}
                                                                            >
                                                                                {reduxIsSpeaking && currentSpeechRef.current === conversation.id ? (
                                                                                    <FaStop className="text-xs" />
                                                                                ) : (
                                                                                    <FaVolumeUp className="text-xs" />
                                                                                )}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {queryLoading && (
                                        <div className="flex justify-start">
                                            <div className="max-w-[70%] lg:max-w-md">
                                                <div className="bg-white lg:bg-gray-100 border lg:border-0 p-3 lg:p-4 rounded-2xl rounded-bl-md shadow-sm">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-6 h-6 lg:w-7 lg:h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <FaRobot className="text-green-500 text-xs lg:text-sm" />
                                                        </div>
                                                        <div className="flex space-x-1">
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                        </div>
                                                        <span className="text-xs text-gray-500">Thinking...</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Voice Input Feedback */}
                        {(isListening || interimTranscript) && (
                            <div className="border-t border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 p-3 lg:p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-2">
                                        {isListening && (
                                            <div className="flex space-x-1">
                                                <div className="w-1 h-4 bg-green-500 rounded animate-pulse"></div>
                                                <div className="w-1 h-6 bg-green-500 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-1 h-5 bg-green-500 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                                <div className="w-1 h-4 bg-green-500 rounded animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                                            </div>
                                        )}
                                        <FaMicrophone className={`text-green-500 ${isListening ? 'animate-pulse' : ''}`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-600 mb-1">
                                            {isListening ? 'Listening...' : 'Processing voice input...'}
                                        </p>
                                        {(interimTranscript || transcript) && (
                                            <p className="text-sm font-medium text-gray-800 italic">
                                                "{interimTranscript || transcript}"
                                            </p>
                                        )}
                                        {voiceSettings.autoSendOnVoiceEnd && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Speech will be sent automatically when you stop speaking
                                            </p>
                                        )}
                                    </div>
                                    {isListening && (
                                        <button
                                            onClick={() => {
                                                stopListening();
                                                cancelAutoSend();
                                            }}
                                            className="text-red-500 hover:text-red-600 p-1"
                                            title="Stop listening"
                                        >
                                            <FaStop />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Input Form */}
                        <div className="border-t border-gray-200 bg-white p-3 lg:p-4 safe-area-inset-bottom sticky bottom-0">
                            <form onSubmit={handleSubmit} className="flex space-x-2 lg:space-x-3">
                                <div className="flex-1 relative">
                                    <textarea
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSubmit(e);
                                            }
                                        }}
                                        placeholder={`Ask in ${getSelectedLanguageName()}...`}
                                        className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm lg:text-base resize-none min-h-[48px] max-h-32"
                                        disabled={queryLoading}
                                        rows={1}
                                        style={{
                                            scrollbarWidth: 'none',
                                            msOverflowStyle: 'none'
                                        }}
                                        onInput={(e) => {
                                            // Auto-resize textarea
                                            e.target.style.height = 'auto';
                                            e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleVoiceInput}
                                        className={`absolute right-3 top-3 p-1.5 rounded-full transition-all duration-200 ${isListening
                                            ? 'text-red-500 hover:text-red-600 bg-red-50 animate-pulse scale-110'
                                            : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                                            }`}
                                        disabled={queryLoading}
                                        title={isListening ? "Stop listening" : "Start voice input"}
                                    >
                                        {isListening ? (
                                            <div className="relative">
                                                <FaMicrophoneSlash className="text-sm lg:text-base" />
                                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                                            </div>
                                        ) : (
                                            <FaMicrophone className="text-sm lg:text-base" />
                                        )}
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!query.trim() || queryLoading}
                                    className="px-4 lg:px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm lg:text-base min-w-[48px] h-12"
                                >
                                    {queryLoading ? (
                                        <div className="w-4 h-4">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <FaPaperPlane className="text-sm" />
                                            <span className="hidden sm:inline">Send</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-semibold text-lg">Conversation History</h3>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="text-gray-500 hover:text-gray-700 p-1"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {conversations.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No conversations yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {conversations.slice().reverse().slice(0, 20).map((conv, index) => (
                                        <div key={index} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <p className="text-sm font-medium text-gray-800 mb-1 line-clamp-2">
                                                {conv.query}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(conv.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="fixed bottom-4 right-4 left-4 lg:left-auto lg:w-96 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
                    <div className="flex items-center justify-between">
                        <p className="text-sm flex-1">{error}</p>
                        <button
                            onClick={() => dispatch(clearError())}
                            className="ml-2 text-red-200 hover:text-white p-1"
                        >
                            <FaTimes className="text-sm" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiAssistantPage;
