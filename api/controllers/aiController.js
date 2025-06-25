const { GoogleGenerativeAI } = require("@google/generative-ai");
const Product = require("../models/ProductModel");

// Helper function to detect stock-related queries in multiple languages
const isStockQuery = (query) => {
    const stockKeywords = [
        // English
        'stock', 'inventory', 'quantity', 'available', 'left', 'remaining', 'how much', 'how many',
        // Hindi
        'स्टॉक', 'भंडार', 'मात्रा', 'उपलब्ध', 'बचा', 'शेष', 'कितना', 'कितनी', 'कितने',
        // Bengali
        'স্টক', 'মজুদ', 'পরিমাণ', 'উপলব্ধ', 'বাকি', 'অবশিষ্ট', 'কতটুকু', 'কত',
        // Telugu
        'స్టాక్', 'నిల్వ', 'పరిమాణం', 'అందుబాటులో', 'మిగిలిన', 'ఎంత', 'ఎన్ని',
        // Marathi
        'स्टॉक', 'साठा', 'प्रमाण', 'उपलब्ध', 'उरलेला', 'शिल्लक', 'किती',
        // Tamil
        'ஸ்டாக்', 'கையிருப்பு', 'அளவு', 'கிடைக்கும்', 'மிச்சம்', 'எவ்வளவு',
        // Gujarati
        'સ્ટોક', 'ભંડાર', 'માત્રા', 'ઉપલબ્ધ', 'બાકી', 'કેટલું', 'કેટલા',
        // Kannada
        'ಸ್ಟಾಕ್', 'ಸಂಗ್ರಹ', 'ಪ್ರಮಾಣ', 'ಲಭ್ಯ', 'ಉಳಿದ', 'ಎಷ್ಟು',
        // Malayalam
        'സ്റ്റോക്ക്', 'സംഭരണം', 'അളവ്', 'ലഭ്യം', 'ബാക്കി', 'എത്ര',
        // Punjabi
        'ਸਟਾਕ', 'ਭੰਡਾਰ', 'ਮਾਤਰਾ', 'ਉਪਲਬਧ', 'ਬਾਕੀ', 'ਕਿੰਨਾ',
        // Odia
        'ଷ୍ଟକ୍', 'ଭଣ୍ଡାର', 'ପରିମାଣ', 'ଉପଲବ୍ଧ', 'ବାକି', 'କେତେ',
        // Assamese
        'ষ্টক', 'ভাণ্ডাৰ', 'পৰিমাণ', 'উপলব্ধ', 'বাকী', 'কিমান',
        // Urdu
        'اسٹاک', 'ذخیرہ', 'مقدار', 'دستیاب', 'باقی', 'کتنا'
    ];

    return stockKeywords.some(keyword =>
        query.toLowerCase().includes(keyword.toLowerCase())
    );
};

// Helper function to extract product name from query using Gemini
const extractProductFromQuery = async (query, language, genAI) => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 100,
            }
        });

        const extractPrompt = `
Extract the product name from this farming stock query. Return only the product name in English, nothing else.
If no specific product is mentioned, return "all".
If multiple products are mentioned, return them separated by commas.

Query: "${query}"

Examples:
"How much wheat do I have?" -> "wheat"
"मेरे पास कितना चावल है?" -> "rice"
"আমার কত টমেটো আছে?" -> "tomato"
"మా దగ్గర ఎంత మొక్కజొన్న ఉంది?" -> "corn"
"माझ्याकडे किती कांदे आहेत?" -> "onion"
"என்னிடம் எவ்வளவு கத்தரிக்காய் உள்ளது?" -> "eggplant"
"Show me all my inventory" -> "all"

Product name in English:`;

        const result = await model.generateContent(extractPrompt);
        const response = await result.response;
        const productName = response.text().trim().toLowerCase();

        return productName;
    } catch (error) {
        console.error('Error extracting product from query:', error);
        return "all";
    }
};

// Helper function to get farmer's stock
const getFarmerStock = async (farmerId, productName = "all") => {
    try {
        let query = { farmer: farmerId, isActive: true };

        if (productName !== "all") {
            // Search for products by name (case-insensitive, partial match)
            query.name = { $regex: productName, $options: 'i' };
        }

        const products = await Product.find(query)
            .select('name quantityAvailable unit price category isOrganic harvestDate')
            .populate('category', 'name')
            .sort({ name: 1 });

        return products;
    } catch (error) {
        console.error('Error fetching farmer stock:', error);
        return [];
    }
};

// Helper function to format stock response in English first
const formatStockResponseEnglish = (products, originalQuery, productName) => {
    if (products.length === 0) {
        if (productName === "all") {
            return "You don't have any products in stock currently.";
        } else {
            return `You don't have any ${productName} in stock currently.`;
        }
    }

    let response = "";

    if (productName === "all") {
        response += "Here's your complete stock inventory:\n\n";
    } else {
        response += `Here's your ${productName} stock information:\n\n`;
    }

    products.forEach((product, index) => {
        response += `${index + 1}. ${product.name}\n`;
        response += `   Quantity: ${product.quantityAvailable} ${product.unit}\n`;
        response += `   Price: ₹${product.price}/${product.unit}\n`;
        response += `   Category: ${product.category ? product.category.name : 'Uncategorized'}\n`;
        if (product.isOrganic) {
            response += `   Type: Organic\n`;
        }
        if (product.harvestDate) {
            const harvestDate = new Date(product.harvestDate).toLocaleDateString();
            response += `   Harvest Date: ${harvestDate}\n`;
        }
        response += "\n";
    });

    // Add summary
    const totalItems = products.reduce((sum, product) => sum + product.quantityAvailable, 0);
    const totalValue = products.reduce((sum, product) => sum + (product.quantityAvailable * product.price), 0);

    response += `Summary:\n`;
    response += `Total Products: ${products.length}\n`;
    response += `Total Items: ${totalItems}\n`;
    response += `Total Estimated Value: ₹${totalValue.toFixed(2)}`;

    return response.trim();
};

// Helper function to translate response to target language
const translateResponse = async (text, targetLanguage, genAI) => {
    if (!targetLanguage || targetLanguage === 'en') {
        return text;
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
            }
        });

        const languageNames = {
            hi: 'Hindi (हिंदी)',
            bn: 'Bengali (বাংলা)',
            te: 'Telugu (తెలుగు)',
            mr: 'Marathi (मराठी)',
            ta: 'Tamil (தமிழ்)',
            gu: 'Gujarati (ગુજરાતી)',
            kn: 'Kannada (ಕನ್ನಡ)',
            ml: 'Malayalam (മലയാളം)',
            pa: 'Punjabi (ਪੰਜਾਬੀ)',
            or: 'Odia (ଓଡ଼ିଆ)',
            as: 'Assamese (অসমীয়া)',
            ur: 'Urdu (اردو)'
        };

        const translatePrompt = `
Translate this farming stock information to ${languageNames[targetLanguage] || targetLanguage} language. 
Keep the following elements unchanged:
- Product names (translate common names but keep specific variety names)
- Numbers and quantities
- Currency symbols (₹)
- Date formats

Be natural and conversational in your translation. Use proper farming terminology in the target language.

Text to translate:
"${text}"

Translation in ${languageNames[targetLanguage] || targetLanguage}:`;

        const translateResult = await model.generateContent(translatePrompt);
        const translateResponse = await translateResult.response;
        return translateResponse.text().trim();
    } catch (error) {
        console.error('Translation error:', error);
        return text; // Return original text if translation fails
    }
};

// @desc    Ask AI for farming advice
// @route   POST /api/ai/ask
// @access  Private (Farmer only)
exports.askFarmingQuery = async (req, res) => {
    try {
        const { query, language } = req.body;
        const farmerId = req.user._id;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Query is required"
            });
        }

        // Validate API key
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                success: false,
                message: "Gemini API key not configured"
            });
        }

        // Initialize Gemini AI
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Check if this is a stock-related query
        if (isStockQuery(query)) {
            try {
                // Extract product name from query (convert to English if needed)
                const productName = await extractProductFromQuery(query, language, genAI);

                // Get farmer's stock from database
                const products = await getFarmerStock(farmerId, productName);

                // Format response in English first
                let stockResponse = formatStockResponseEnglish(products, query, productName);

                // Translate to target language if needed
                if (language && language !== 'en') {
                    stockResponse = await translateResponse(stockResponse, language, genAI);
                }

                return res.json({
                    success: true,
                    data: {
                        query: query,
                        answer: stockResponse,
                        language: language || 'en',
                        type: 'stock_query',
                        productCount: products.length,
                        totalQuantity: products.reduce((sum, p) => sum + p.quantityAvailable, 0)
                    }
                });
            } catch (stockError) {
                console.error('Stock query error:', stockError);
                // Fall through to regular AI query if stock query fails
            }
        }

        // Regular AI query processing for non-stock queries
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        });

        // Create a comprehensive prompt for Indian farming context
        const prompt = `You are an expert agricultural advisor specializing in Indian farming practices. 
    You have deep knowledge about:
    - Indian crops, seeds, and varieties suitable for different regions
    - Monsoon patterns and seasonal farming in India
    - Traditional and modern farming techniques used in India
    - Common pests and diseases affecting Indian crops
    - Organic farming methods popular in India
    - Government schemes and subsidies for Indian farmers
    - Soil types across different Indian states
    - Irrigation methods suitable for Indian conditions
    - Market prices and crop economics in India
    - Regional farming practices across different Indian states

    Please answer the following farming query in a helpful, practical manner. 
    If the query is not in English, please respond in the same language as the query.
    Keep your response focused on Indian farming context and provide actionable advice.
    Do not bold the text or use "*" in your responses in any language. Answer in plain simple text
    
    Query: ${query}
    
    ${language && language !== 'en' ? `Please respond in ${language} language.` : ''}
    
    Provide practical, region-specific advice that considers Indian farming conditions, climate, and practices.`;

        // Generate response
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const answer = response.text();

        res.json({
            success: true,
            data: {
                query: query,
                answer: answer,
                language: language || 'en',
                type: 'general_query'
            }
        });
    } catch (error) {
        console.error('AI Query Error:', error);

        // More specific error handling for API key issues
        if (error.status === 400 && error.errorDetails) {
            const apiKeyError = error.errorDetails.find(detail =>
                detail.reason === 'API_KEY_INVALID'
            );

            if (apiKeyError) {
                console.error('Invalid API Key detected');
                console.error('Current API Key length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 'undefined');
                console.error('API Key starts with:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + '...' : 'undefined');
            }
        }

        res.status(500).json({
            success: false,
            message: "Failed to process AI query",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Get AI conversation history
// @route   GET /api/ai/history
// @access  Private (Farmer only)
exports.getQueryHistory = async (req, res) => {
    try {
        // In a real application, you might want to store query history in database
        // For now, we'll return an empty array as this is a basic implementation
        res.json({
            success: true,
            data: {
                queries: [],
                message: "Query history feature can be implemented with database storage"
            }
        });
    } catch (error) {
        console.error('History Error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch query history"
        });
    }
};

// @desc    Get supported languages
// @route   GET /api/ai/languages
// @access  Public
exports.getSupportedLanguages = async (req, res) => {
    try {
        const supportedLanguages = [
            { code: 'en', name: 'English', nativeName: 'English' },
            { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
            { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
            { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
            { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
            { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
            { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
            { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
            { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
            { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
            { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
            { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
            { code: 'ur', name: 'Urdu', nativeName: 'اردو' }
        ];

        res.json({
            success: true,
            data: supportedLanguages
        });
    } catch (error) {
        console.error('Languages Error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch supported languages"
        });
    }
};

// @desc    Get sample queries for the AI assistant
// @route   GET /api/ai/sample-queries
// @access  Public
exports.getSampleQueries = async (req, res) => {
    try {
        const sampleQueries = [
            // General farming queries
            {
                en: "What is the best time to plant rice in monsoon season?",
                hi: "मानसून में धान बोने का सबसे अच्छा समय कौन सा है?",
                bn: "বর্ষাকালে ধান রোপণের সেরা সময় কোনটি?",
                te: "ఋతుపవన కాలంలో వరి నాటడానికి ఉత్తమ సమయం ఏది?",
                mr: "पावसाळ्यात भात लावण्यासाठी सर्वोत्तम वेळ कोणती आहे?",
                ta: "பருவமழைக் காலத்தில் நெல் நடுவதற்கு சிறந்த நேரம் எது?",
                gu: "ચોમાસાની ઋતુમાં ડાંગર વાવવાનો શ્રેષ્ઠ સમય કયો છે?",
                kn: "ಮುಂಗಾರು ಹಂಗಾಮಿನಲ್ಲಿ ಭತ್ತ ನೆಡಲು ಉತ್ತಮ ಸಮಯ ಯಾವುದು?",
                ml: "മഴക്കാലത്ത് നെൽകൃഷിക്ക് ഏറ്റവും അനുയോജ്യമായ സമയം ഏതാണ്?",
                pa: "ਮਾਨਸੂਨ ਦੇ ਮੌਸਮ ਵਿੱਚ ਝੋਨਾ ਲਗਾਉਣ ਦਾ ਸਭ ਤੋਂ ਵਧੀਆ ਸਮਾਂ ਕਦੋਂ ਹੈ?",
                or: "ବର୍ଷା ଋତୁରେ ଧାନ ରୋପଣ ପାଇଁ ସର୍ବୋତ୍ତମ ସମୟ କେତେବେଳେ?",
                as: "বৰষুণৰ দিনত ধান ৰোৱাৰ সৰ্বোত্তম সময় কেতিয়া?",
                ur: "مانسون کے موسم میں چاول لگانے کا بہترین وقت کب ہے؟"
            },
            // Stock queries
            {
                en: "How much wheat do I have in stock?",
                hi: "मेरे पास कितना गेहूं स्टॉक में है?",
                bn: "আমার কত গম স্টকে আছে?",
                te: "నా దగ్గర ఎంత గోధుమలు స్టాక్‌లో ఉన్నాయి?",
                mr: "माझ्याकडे किती गहू स्टॉकमध्ये आहे?",
                ta: "என்னிடம் எவ்வளவு கோதுமை கையிருப்பில் உள்ளது?",
                gu: "મારી પાસે કેટલું ઘઉં સ્ટોકમાં છે?",
                kn: "ನನ್ನ ಬಳಿ ಎಷ್ಟು ಗೋಧಿ ಸ್ಟಾಕ್‌ನಲ್ಲಿದೆ?",
                ml: "എന്റെ കയ്യിൽ എത്ര ഗോതമ്പ് സ്റ്റോക്കിൽ ഉണ്ട്?",
                pa: "ਮੇਰੇ ਕੋਲ ਕਿੰਨਾ ਕਣਕ ਸਟਾਕ ਵਿੱਚ ਹੈ?",
                or: "ମୋର କେତେ ଗହମ ଷ୍ଟକରେ ଅଛି?",
                as: "মোৰ ওচৰত কিমান ঘেঁহু ষ্টকত আছে?",
                ur: "میرے پاس کتنا گندم اسٹاک میں ہے؟"
            },
            {
                en: "Show me all my inventory",
                hi: "मेरा सारा स्टॉक दिखाएं",
                bn: "আমার সব ইনভেন্টরি দেখান",
                te: "నా మొత్తం ఇన్వెంటరీ చూపించండి",
                mr: "माझी सर्व यादी दाखवा",
                ta: "என் முழு கையிருப்பையும் காட்டுங்கள்",
                gu: "મારી બધી યાદી બતાવો",
                kn: "ನನ್ನ ಸಂಪೂರ್ಣ ದಾಸ್ತಾನು ತೋರಿಸಿ",
                ml: "എന്റെ മുഴുവൻ ഇൻവെന്ററിയും കാണിക്കൂ",
                pa: "ਮੇਰੀ ਸਾਰੀ ਸੂਚੀ ਦਿਖਾਓ",
                or: "ମୋର ସମସ୍ତ ତାଲିକା ଦେଖାନ୍ତୁ",
                as: "মোৰ সকলো তালিকা দেখুৱাওক",
                ur: "میری تمام فہرست دکھائیں"
            },
            {
                en: "How many tomatoes are available?",
                hi: "कितने टमाटर उपलब्ध हैं?",
                bn: "কত টমেটো পাওয়া যাচ্ছে?",
                te: "ఎన్ని టొమాటోలు అందుబాటులో ఉన్నాయి?",
                mr: "किती टोमॅटो उपलब्ध आहेत?",
                ta: "எத்தனை தக்காளி கிடைக்கிறது?",
                gu: "કેટલા ટામેટા ઉપલબ્ધ છે?",
                kn: "ಎಷ್ಟು ಟೊಮೇಟೊಗಳು ಲಭ್ಯವಿದೆ?",
                ml: "എത്ര തക്കാളി ലഭ്യമാണ്?",
                pa: "ਕਿੰਨੇ ਟਮਾਟਰ ਉਪਲਬਧ ਹਨ?",
                or: "କେତେ ଟମାଟୋ ଉପଲବ୍ଧ ଅଛି?",
                as: "কিমান টমেটো উপলব্ধ আছে?",
                ur: "کتنے ٹماٹر دستیاب ہیں؟"
            },
            // Farming advice queries
            {
                en: "How to control pests in organic farming?",
                hi: "जैविक खेती में कीटों को कैसे नियंत्रित करें?",
                bn: "জৈব কৃষিতে কীট নিয়ন্ত্রণ কীভাবে করবেন?",
                te: "సేంద్రీయ వ్యవసాయంలో కీటకాలను ఎలా నియంత్రించాలి?",
                mr: "सेंद्रिय शेतीत कीड नियंत्रण कसे करावे?",
                ta: "இயற்கை வேளாண்மையில் பூச்சிகளைக் கட்டுப்படுத்துவது எப்படி?",
                gu: "કાર્બનિક ખેતીમાં જંતુઓ કેવી રીતે નિયંત્રિત કરવા?",
                kn: "ಸಾವಯವ ಕೃಷಿಯಲ್ಲಿ ಕೀಟಗಳನ್ನು ಹೇಗೆ ನಿಯಂತ್ರಿಸುವುದು?",
                ml: "ജൈവകൃഷിയിൽ കീടങ്ങളെ എങ്ങനെ നിയന്ത്രിക്കാം?",
                pa: "ਜੈਵਿਕ ਖੇਤੀ ਵਿੱਚ ਕੀੜਿਆਂ ਨੂੰ ਕਿਵੇਂ ਕੰਟਰੋਲ ਕਰਨਾ?",
                or: "ଜୈବିକ କୃଷିରେ କୀଟପତଙ୍ଗ କିପରି ନିୟନ୍ତ୍ରଣ କରିବେ?",
                as: "জৈৱিক কৃষিত পোক-পতংগ কেনেকৈ নিয়ন্ত্ৰণ কৰিব?",
                ur: "نامیاتی کاشتکاری میں کیڑوں کو کیسے کنٹرول کریں؟"
            },
            {
                en: "Best fertilizer for vegetable crops",
                hi: "सब्जी की फसलों के लिए सबसे अच्छा उर्वरक",
                bn: "সবজি ফসলের জন্য সেরা সার",
                te: "కూరగాయల పంటలకు ఉత్తమ ఎరువు",
                mr: "भाजीपाला पिकांसाठी सर्वोत्तम खत",
                ta: "காய்கறி பயிர்களுக்கு சிறந்த உரம்",
                gu: "શાકભાજીના પાકો માટે શ્રેષ્ઠ ખાતર",
                kn: "ತರಕಾರಿ ಬೆಳೆಗಳಿಗೆ ಅತ್ಯುತ್ತಮ ಗೊಬ್ಬರ",
                ml: "പച്ചക്കറി വിളകൾക്ക് മികച്ച വളം",
                pa: "ਸਬਜ਼ੀਆਂ ਦੀਆਂ ਫਸਲਾਂ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਖਾਦ",
                or: "ପନିପରିବା ଫସଲ ପାଇଁ ସର୍ବୋତ୍ତମ ସାର",
                as: "পাচলি শস্যৰ বাবে উত্তম সাৰ",
                ur: "سبزیوں کی فصلوں کے لیے بہترین کھاد"
            }
        ];

        res.json({
            success: true,
            data: sampleQueries
        });
    } catch (error) {
        console.error('Sample Queries Error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch sample queries"
        });
    }
};
