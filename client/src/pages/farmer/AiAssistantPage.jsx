import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    askFarmingQuery,
    getSupportedLanguages,
    setSelectedLanguage,
    clearError
} from "../../redux/slices/aiSlice";
import Loader from "../../components/Loader";
import {
    FaMicrophone,
    FaMicrophoneSlash,
    FaPaperPlane,
    FaRobot,
    FaUser,
    FaLanguage,
    FaHistory,
    FaLeaf,
    FaLightbulb
} from "react-icons/fa";

const AiAssistantPage = () => {
    const dispatch = useDispatch();
    const {
        conversations,
        currentConversation,
        supportedLanguages,
        queryLoading,
        selectedLanguage,
        error
    } = useSelector((state) => state.ai);

    const [query, setQuery] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const messagesEndRef = useRef(null);

    // Sample queries for suggestions
    const sampleQueries = [
        {
            en: "What is the best time to plant rice in monsoon season?",
            hi: "मानसून में धान बोने का सबसे अच्छा समय कौन सा है?",
            category: "Seasonal Farming"
        },
        {
            en: "How to control pest attacks on tomato plants?",
            hi: "टमाटर के पौधों पर कीट हमले को कैसे नियंत्रित करें?",
            category: "Pest Control"
        },
        {
            en: "What are the government subsidies available for organic farming?",
            hi: "जैविक खेती के लिए कौन सी सरकारी सब्सिडी उपलब्ध है?",
            category: "Government Schemes"
        },
        {
            en: "Best irrigation methods for water conservation",
            hi: "पानी के संरक्षण के लिए सबसे अच्छी सिंचाई विधियां",
            category: "Water Management"
        }
    ];

    useEffect(() => {
        dispatch(getSupportedLanguages());

        // Initialize speech recognition if available
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();

            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = getLanguageCode(selectedLanguage);

            recognitionInstance.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setQuery(transcript);
                setIsListening(false);
            };

            recognitionInstance.onerror = () => {
                setIsListening(false);
            };

            recognitionInstance.onend = () => {
                setIsListening(false);
            };

            setRecognition(recognitionInstance);
        }
    }, [dispatch, selectedLanguage]);

    useEffect(() => {
        scrollToBottom();
    }, [conversations]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

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
        if (!recognition) {
            alert("Speech recognition is not supported in your browser");
            return;
        }

        if (isListening) {
            recognition.stop();
            setIsListening(false);
        } else {
            recognition.lang = getLanguageCode(selectedLanguage);
            recognition.start();
            setIsListening(true);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        const queryData = {
            query: query.trim(),
            language: selectedLanguage
        };

        dispatch(askFarmingQuery(queryData));
        setQuery("");
    };

    const handleSampleQuery = (sampleQuery) => {
        const queryText = selectedLanguage === 'en' ? sampleQuery.en : (sampleQuery[selectedLanguage] || sampleQuery.en);
        setQuery(queryText);
    };

    const handleLanguageChange = (langCode) => {
        dispatch(setSelectedLanguage(langCode));
        setShowLanguageDropdown(false);
    };

    const getSelectedLanguageName = () => {
        const lang = supportedLanguages.find(l => l.code === selectedLanguage);
        return lang ? lang.nativeName : 'English';
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex items-center mb-8">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                        <FaRobot className="text-white text-xl" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">AI Farming Assistant</h1>
                        <p className="text-gray-600">Get expert farming advice in your language</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Language Selector */}
                    <div className="bg-white rounded-xl shadow-md p-4">
                        <h3 className="font-semibold mb-3 flex items-center">
                            <FaLanguage className="mr-2 text-green-500" />
                            Language
                        </h3>
                        <div className="relative">
                            <button
                                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                                className="w-full p-3 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-green-500 transition-colors"
                            >
                                <span>{getSelectedLanguageName()}</span>
                                <span className="text-gray-400">▼</span>
                            </button>

                            {showLanguageDropdown && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {supportedLanguages.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => handleLanguageChange(lang.code)}
                                            className={`w-full p-3 text-left hover:bg-green-50 transition-colors ${selectedLanguage === lang.code ? 'bg-green-100 text-green-700' : ''
                                                }`}
                                        >
                                            {lang.nativeName}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sample Queries */}
                    <div className="bg-white rounded-xl shadow-md p-4">
                        <h3 className="font-semibold mb-3 flex items-center">
                            <FaLightbulb className="mr-2 text-yellow-500" />
                            Quick Queries
                        </h3>
                        <div className="space-y-2">
                            {sampleQueries.map((sample, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSampleQuery(sample)}
                                    className="w-full p-2 text-left text-sm bg-gray-50 hover:bg-green-50 rounded-lg transition-colors border border-gray-200 hover:border-green-300"
                                >
                                    <div className="font-medium text-green-600 text-xs mb-1">
                                        {sample.category}
                                    </div>
                                    <div className="text-gray-700 line-clamp-2">
                                        {selectedLanguage === 'en' ? sample.en : (sample[selectedLanguage] || sample.en)}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* History Toggle */}
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="w-full bg-white rounded-xl shadow-md p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                        <span className="flex items-center font-semibold">
                            <FaHistory className="mr-2 text-blue-500" />
                            Conversation History
                        </span>
                        <span className="text-gray-400">{showHistory ? '▼' : '▶'}</span>
                    </button>
                </div>

                {/* Main Chat Area */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-xl shadow-md h-[600px] flex flex-col">
                        {/* Chat Messages */}
                        <div className="flex-1 p-6 overflow-y-auto space-y-4">
                            {conversations.length === 0 ? (
                                <div className="text-center py-12">
                                    <FaLeaf className="text-green-500 text-5xl mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                        Welcome to AI Farming Assistant
                                    </h3>
                                    <p className="text-gray-500 mb-4">
                                        Ask any farming-related question in your preferred language
                                    </p>
                                    <div className="text-sm text-gray-400">
                                        You can type your question or use the microphone to speak
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {conversations.map((conversation, index) => (
                                        <div key={index} className="space-y-4">
                                            {/* User Message */}
                                            <div className="flex justify-end">
                                                <div className="max-w-xs lg:max-w-md">
                                                    <div className="bg-green-500 text-white p-4 rounded-2xl rounded-br-md">
                                                        <div className="flex items-start space-x-2">
                                                            <FaUser className="text-sm mt-1 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-sm">{conversation.query}</p>
                                                                <p className="text-xs text-green-100 mt-1">
                                                                    {new Date(conversation.timestamp).toLocaleTimeString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* AI Response */}
                                            <div className="flex justify-start">
                                                <div className="max-w-xs lg:max-w-2xl">
                                                    <div className="bg-gray-100 p-4 rounded-2xl rounded-bl-md">
                                                        <div className="flex items-start space-x-2">
                                                            <FaRobot className="text-green-500 text-sm mt-1 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                                                    {conversation.answer}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    AI Assistant
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {queryLoading && (
                                        <div className="flex justify-start">
                                            <div className="max-w-xs lg:max-w-md">
                                                <div className="bg-gray-100 p-4 rounded-2xl rounded-bl-md">
                                                    <div className="flex items-center space-x-2">
                                                        <FaRobot className="text-green-500" />
                                                        <div className="flex space-x-1">
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Form */}
                        <div className="border-t border-gray-200 p-4">
                            <form onSubmit={handleSubmit} className="flex space-x-3">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={`Ask your farming question in ${getSelectedLanguageName()}...`}
                                        className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        disabled={queryLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleVoiceInput}
                                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${isListening
                                                ? 'text-red-500 hover:text-red-600'
                                                : 'text-gray-400 hover:text-green-500'
                                            }`}
                                        disabled={queryLoading}
                                    >
                                        {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!query.trim() || queryLoading}
                                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                                >
                                    {queryLoading ? (
                                        <Loader />
                                    ) : (
                                        <>
                                            <FaPaperPlane />
                                            <span>Send</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Sidebar */}
            {showHistory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
                    <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl p-6 overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Conversation History</h3>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        {conversations.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No conversations yet</p>
                        ) : (
                            <div className="space-y-3">
                                {conversations.slice(0, 10).map((conv, index) => (
                                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm font-medium text-gray-800 mb-1 line-clamp-2">
                                            {conv.query}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(conv.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
                    <p>{error}</p>
                    <button
                        onClick={() => dispatch(clearError())}
                        className="ml-2 text-red-200 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
};

export default AiAssistantPage;
