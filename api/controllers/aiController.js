const { GoogleGenerativeAI } = require("@google/generative-ai");
const Product = require("../models/ProductModel");

// Helper function to detect stock-related queries in multiple languages
const isStockQuery = (query) => {
    const stockKeywords = [
        // English
        'stock', 'inventory', 'quantity', 'available', 'left', 'remaining', 'how much', 'how many',
        'do i have', 'have i got', 'i have', 'my stock', 'my inventory', 'what do i have',
        'show me', 'check my', 'any wheat', 'any rice', 'any tomato', 'any onion', 'any product',
        // Hindi
        'स्टॉक', 'भंडार', 'मात्रा', 'उपलब्ध', 'बचा', 'शेष', 'कितना', 'कितनी', 'कितने',
        'मेरे पास', 'मेरा', 'क्या मेरे पास', 'दिखाओ', 'देखो', 'कोई गेहूं', 'कोई चावल',
        // Bengali
        'স্টক', 'মজুদ', 'পরিমাণ', 'উপলব্ধ', 'বাকি', 'অবশিষ্ট', 'কতটুকু', 'কত',
        'আমার কাছে', 'আমার', 'কি আমার আছে', 'দেখাও', 'কোন গম', 'কোন চাল',
        // Telugu
        'స్టాక్', 'నిల్వ', 'పరిమాణం', 'అందుబాటులో', 'మిగిలిన', 'ఎంత', 'ఎన్ని',
        'నా దగ్గర', 'నాకు', 'ఏదైనా గోధుమలు', 'ఏదైనా వరి', 'చూపించు',
        // Marathi
        'स्टॉक', 'साठा', 'प्रमाण', 'उपलब्ध', 'उरलेला', 'शिल्लक', 'किती',
        'माझ्याकडे', 'माझा', 'काही गहू', 'काही तांदूळ', 'दाखवा',
        // Tamil
        'ஸ்டாக்', 'கையிருப்பு', 'அளவு', 'கிடைக்கும்', 'மிச்சம்', 'எவ்வளவு',
        'என்னிடம்', 'என்', 'ஏதேனும் கோதுமை', 'ஏதேனும் அரிசி', 'காட்டு',
        // Gujarati
        'સ્ટોક', 'ભંડાર', 'માત્રા', 'ઉપલબ્ધ', 'બાકી', 'કેટલું', 'કેટલા',
        'મારી પાસે', 'મારું', 'કોઈ ઘઉં', 'કોઈ ચોખા', 'બતાવો',
        // Kannada
        'ಸ್ಟಾಕ್', 'ಸಂಗ್ರಹ', 'ಪ್ರಮಾಣ', 'ಲಭ್ಯ', 'ಉಳಿದ', 'ಎಷ್ಟು',
        'ನನ್ನ ಬಳಿ', 'ನನ್ನ', 'ಯಾವುದೇ ಗೋಧಿ', 'ಯಾವುದೇ ಅಕ್ಕಿ', 'ತೋರಿಸು',
        // Malayalam
        'സ്റ്റോക്ക്', 'സംഭരണം', 'അളവ്', 'ലഭ്യം', 'ബാക്കി', 'എത്ര',
        'എന്റെ കയ്യിൽ', 'എന്റെ', 'എന്തെങ്കിലും ഗോതമ്പ്', 'എന്തെങ്കിലും അരി', 'കാണിക്കൂ',
        // Punjabi
        'ਸਟਾਕ', 'ਭੰਡਾਰ', 'ਮਾਤਰਾ', 'ਉਪਲਬਧ', 'ਬਾਕੀ', 'ਕਿੰਨਾ',
        'ਮੇਰੇ ਕੋਲ', 'ਮੇਰਾ', 'ਕੋਈ ਕਣਕ', 'ਕੋਈ ਚਾਵਲ', 'ਦਿਖਾਓ',
        // Odia
        'ଷ୍ଟକ୍', 'ଭଣ୍ଡାର', 'ପରିମାଣ', 'ଉପଲବ୍ଧ', 'ବାକି', 'କେତେ',
        'ମୋର ପାଖରେ', 'ମୋର', 'କୌଣସି ଗହମ', 'କୌଣସି ଚାଉଳ', 'ଦେଖାଅ',
        // Assamese
        'ষ্টক', 'ভাণ্ডাৰ', 'পৰিমাণ', 'উপলব্ধ', 'বাকী', 'কিমান',
        'মোৰ ওচৰত', 'মোৰ', 'কোনো ঘেঁহু', 'কোনো চাউল', 'দেখুৱাওক',
        // Urdu
        'اسٹاک', 'ذخیرہ', 'مقدار', 'دستیاب', 'باقی', 'کتنا',
        'میرے پاس', 'میرا', 'کوئی گندم', 'کوئی چاول', 'دکھائیں'
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

// Helper function to format speech response (optimized for TTS)
const formatStockResponseForSpeech = (products, originalQuery, productName) => {
    if (products.length === 0) {
        if (productName === "all") {
            return "You don't have any products in stock currently.";
        } else {
            return `You don't have any ${productName} in stock currently.`;
        }
    }

    let response = "";

    if (productName === "all") {
        response += "Your current stock: ";
    } else {
        response += `Your ${productName} stock: `;
    }

    products.forEach((product, index) => {
        if (index > 0) response += ", ";
        response += `${product.quantityAvailable} ${product.unit} of ${product.name} at ₹${product.price} per ${product.unit}`;

        if (product.isOrganic) {
            response += " (organic)";
        }

        if (product.harvestDate) {
            const harvestDate = new Date(product.harvestDate);
            const day = harvestDate.getDate();
            const month = harvestDate.toLocaleDateString('en-US', { month: 'long' });
            const year = harvestDate.getFullYear();
            response += ` harvested on ${day} ${month} ${year}`;
        }
    });

    // Add concise summary
    const totalItems = products.reduce((sum, product) => sum + product.quantityAvailable, 0);
    const totalValue = products.reduce((sum, product) => sum + (product.quantityAvailable * product.price), 0);

    response += `. Total: ${products.length} products, ${totalItems} items, worth ₹${totalValue.toFixed(2)}.`;

    return response.trim();
};

// Helper function to format detailed display response (optimized for screen display)
const formatStockResponseForDisplay = (products, originalQuery, productName) => {
    if (products.length === 0) {
        const emptyResponse = {
            summary: productName === "all" ? "No products in stock" : `No ${productName} in stock`,
            products: [],
            totals: {
                productCount: 0,
                totalQuantity: 0,
                totalValue: 0,
                organicCount: 0
            },
            message: productName === "all"
                ? "You don't have any products in stock currently."
                : `You don't have any ${productName} in stock currently.`
        };
        return emptyResponse;
    }

    // Calculate totals
    const totalItems = products.reduce((sum, product) => sum + product.quantityAvailable, 0);
    const totalValue = products.reduce((sum, product) => sum + (product.quantityAvailable * product.price), 0);
    const organicCount = products.filter(product => product.isOrganic).length;

    // Format products for display
    const formattedProducts = products.map(product => {
        const harvestDate = product.harvestDate ? new Date(product.harvestDate) : null;
        return {
            id: product._id,
            name: product.name,
            quantity: product.quantityAvailable,
            unit: product.unit,
            price: product.price,
            priceFormatted: `₹${product.price.toFixed(2)}`,
            totalValue: product.quantityAvailable * product.price,
            totalValueFormatted: `₹${(product.quantityAvailable * product.price).toFixed(2)}`,
            isOrganic: product.isOrganic,
            category: product.category?.name || 'Uncategorized',
            harvestDate: harvestDate,
            harvestDateFormatted: harvestDate
                ? `${harvestDate.getDate()} ${harvestDate.toLocaleDateString('en-US', { month: 'long' })} ${harvestDate.getFullYear()}`
                : null,
            daysSinceHarvest: harvestDate
                ? Math.floor((new Date() - harvestDate) / (1000 * 60 * 60 * 24))
                : null
        };
    });

    return {
        summary: productName === "all" ? "Current Inventory" : `${productName.charAt(0).toUpperCase() + productName.slice(1)} Stock`,
        products: formattedProducts,
        totals: {
            productCount: products.length,
            totalQuantity: totalItems,
            totalValue: totalValue,
            totalValueFormatted: `₹${totalValue.toFixed(2)}`,
            organicCount: organicCount,
            organicPercentage: products.length > 0 ? ((organicCount / products.length) * 100).toFixed(1) : 0
        },
        message: `You have ${products.length} product${products.length > 1 ? 's' : ''} with ${totalItems} total items worth ${`₹${totalValue.toFixed(2)}`}.`
    };
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

                // Generate speech response (optimized for TTS)
                let speechResponse = formatStockResponseForSpeech(products, query, productName);

                // Generate detailed display response (optimized for screen)
                const displayResponse = formatStockResponseForDisplay(products, query, productName);

                // Translate speech response to target language if needed
                if (language && language !== 'en') {
                    speechResponse = await translateResponse(speechResponse, language, genAI);
                }

                return res.json({
                    success: true,
                    data: {
                        query: query,
                        answer: speechResponse, // For speech synthesis
                        speechAnswer: speechResponse, // Explicit speech version
                        displayAnswer: displayResponse, // Detailed version for display
                        language: language || 'en',
                        type: 'stock_query',
                        productCount: products.length,
                        totalQuantity: products.reduce((sum, p) => sum + p.quantityAvailable, 0),
                        hasDisplayData: true
                    }
                });
            } catch (stockError) {
                console.error('Stock query error:', stockError);
                // Fall through to regular AI query if stock query fails
            }
        }

        // Regular AI query processing for non-stock queries
        const dualResponse = await generateDualResponse(genAI, query, language);

        res.json({
            success: true,
            data: {
                query: query,
                answer: dualResponse.speechAnswer, // For speech synthesis
                speechAnswer: dualResponse.speechAnswer, // Explicit speech version
                displayAnswer: dualResponse.displayAnswer, // Detailed version for display
                language: language || 'en',
                type: 'general_query',
                hasDisplayData: true
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

// @desc    Speech-to-Text for voice input
// @route   POST /api/ai/stt
// @access  Private (Farmer only)
exports.speechToText = async (req, res) => {
    try {
        const { audioData, language = 'en' } = req.body;

        if (!audioData) {
            return res.status(400).json({
                success: false,
                message: "Audio data is required for STT"
            });
        }

        // Note: For free STT, we're using the browser's Web Speech API
        // This endpoint primarily handles the language configuration
        // The actual STT is handled by the browser's SpeechRecognition API

        const languageSTTMap = {
            'en': 'en-IN',
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
            'ur': 'ur-PK'
        };

        res.json({
            success: true,
            data: {
                language: language,
                sttLang: languageSTTMap[language] || 'en-IN',
                isConfigured: true
            }
        });
    } catch (error) {
        console.error('STT Error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to process STT request"
        });
    }
};

// @desc    Text-to-Speech for AI responses
// @route   POST /api/ai/tts
// @access  Private (Farmer only)
exports.textToSpeech = async (req, res) => {
    try {
        const { text, language = 'en' } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                message: "Text is required for TTS"
            });
        }

        // For a free TTS solution, we'll use the Web Speech API on the client side
        // This endpoint will return the text with appropriate language code
        // The actual TTS will be handled by the browser's speechSynthesis API

        const languageVoiceMap = {
            'en': 'en-IN',
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
            'ur': 'ur-PK'
        };

        res.json({
            success: true,
            data: {
                text: text,
                language: language,
                voiceLang: languageVoiceMap[language] || 'en-IN',
                shouldSpeak: true
            }
        });
    } catch (error) {
        console.error('TTS Error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to process TTS request"
        });
    }
};

// @desc    Generate smart speech text using Gemini
// @route   POST /api/ai/generate-speech-text
// @access  Private (Farmer only)
exports.generateSmartSpeechText = async (req, res) => {
    try {
        const { text, language = 'en' } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                message: "Text is required"
            });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        });

        // Create language-specific prompt for natural speech conversion
        const languageNames = {
            'en': 'English',
            'hi': 'Hindi',
            'bn': 'Bengali',
            'te': 'Telugu',
            'mr': 'Marathi',
            'ta': 'Tamil',
            'gu': 'Gujarati',
            'kn': 'Kannada',
            'ml': 'Malayalam',
            'pa': 'Punjabi',
            'or': 'Odia',
            'as': 'Assamese',
            'ur': 'Urdu'
        };

        const targetLanguage = languageNames[language] || 'English';

        const prompt = `
Convert the following farming inventory text into natural, direct speech in ${targetLanguage}. Make it personal and to-the-point, like someone explaining their own stock.

CRITICAL REQUIREMENTS:
1. **Be Direct & Personal**: Use "you have" / "aapke paas" approach
   - English: "You have 50 kg of rice at 25 rupees per kg"
   - Hindi: "आपके पास पचास किलो चावल है, पच्चीस रुपये किलो के हिसाब से"

2. **Include ALL Details BUT BE CONCISE**: 
   - Exact quantities with units
   - Complete prices (convert ₹25.00 to "twenty-five rupees" / "पच्चीस रुपये")
   - ACTUAL harvest dates (not just "harvest date" - say the real date!)
   - Organic status when applicable

3. **Numbers**: 
   - Always convert to words: "50" → "fifty" / "पचास"
   - NEVER say ".00" - convert ₹25.00 to "twenty-five rupees"

4. **Harvest Dates**: 
   - MUST include the actual date: "harvested on 15 November 2024" → "15 नवंबर को काटा गया"
   - Don't skip dates - they're crucial information!

5. **Flow**: 
   - Remove list formatting
   - Make it conversational but complete
   - End with totals: "In total, you have..." / "कुल मिलाकर आपके पास..."

6. **Language Style**:
   - Hindi: Use "आपके पास" (you have), natural farm terms
   - English: Use "you have", clear farmer language
   - Keep it simple but comprehensive
   - Be concise - don't repeat information

Text to convert:
"${text}"

Natural, direct speech in ${targetLanguage} (include ALL details, especially harvest dates, but be concise):
        `.trim();

        const result = await model.generateContent(prompt);

        if (!result || !result.response) {
            throw new Error("Empty response from Gemini API");
        }

        const response = await result.response;
        let smartText = response.text().trim();

        // Clean up any remaining artifacts and unwanted response prefixes
        smartText = smartText
            .replace(/^["'*]+|["'*]+$/g, "")
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .trim();

        // Remove unwanted response prefixes in all languages
        const unwantedPrefixes = [
            // English prefixes
            /^(ok,?\s*)?here'?s?\s*(the\s*)?(direct\s*)?speech\s*(conversion|text|response)[:\s,.]*/gi,
            /^(ok,?\s*)?here\s*is\s*(the\s*)?(direct\s*)?speech\s*(conversion|text|response)[:\s,.]*/gi,
            /^(alright,?\s*)?here'?s?\s*(your\s*)?(direct\s*)?speech\s*(conversion|text|response)[:\s,.]*/gi,
            /^(sure,?\s*)?here'?s?\s*(the\s*)?(converted\s*)?speech[:\s,.]*/gi,
            /^(ok,?\s*)?natural,?\s*direct\s*speech\s*in\s*\w+[:\s,.]*/gi,
            /^(here'?s?\s*)?the\s*natural,?\s*direct\s*speech[:\s,.]*/gi,
            /^translation\s*in\s*\w+[:\s,.]*/gi,
            /^natural,?\s*direct\s*speech\s*in\s*\w+[:\s,.]*/gi,

            // Hindi prefixes
            /^(ठीक है,?\s*)?यहाँ\s*(प्रत्यक्ष\s*)?भाषण\s*(रूपांतरण|पाठ|प्रतिक्रिया)\s*(है|हैं?)[:\s,.]*/gi,
            /^(ठीक,?\s*)?यह\s*(प्रत्यक्ष\s*)?भाषण\s*(रूपांतरण|पाठ|प्रतिक्रिया)\s*(है|हैं?)[:\s,.]*/gi,
            /^(अच्छा,?\s*)?यहाँ\s*(आपका\s*)?भाषण\s*(रूपांतरण|पाठ)\s*(है|हैं?)[:\s,.]*/gi,
            /^हिंदी\s*में\s*अनुवाद[:\s,.]*/gi,
            /^हिंदी\s*में\s*(प्राकृतिक|प्रत्यक्ष)\s*भाषण[:\s,.]*/gi,

            // Bengali prefixes
            /^(ঠিক আছে,?\s*)?এখানে\s*(সরাসরি\s*)?বক্তৃতা\s*(রূপান্তর|পাঠ|প্রতিক্রিয়া)[:\s,.]*/gi,
            /^(ভাল,?\s*)?এই\s*(সরাসরি\s*)?বক্তৃতা\s*(রূপান্তর|পাঠ)[:\s,.]*/gi,
            /^বাংলায়\s*অনুবাদ[:\s,.]*/gi,
            /^বাংলায়\s*(প্রাকৃতিক|সরাসরি)\s*বক্তৃতা[:\s,.]*/gi,

            // Telugu prefixes
            /^(సరే,?\s*)?ఇక్కడ\s*(ప్రత్యక్ష\s*)?ప్రసంగం\s*(మార్పిడి|వచనం|ప్రతిస్పందన)[:\s,.]*/gi,
            /^(మంచిది,?\s*)?ఇది\s*(ప్రత్యక్ష\s*)?ప్రసంగం\s*(మార్పిడి|వచనం)[:\s,.]*/gi,
            /^తెలుగులో\s*అనువాదం[:\s,.]*/gi,

            // Marathi prefixes
            /^(ठीक आहे,?\s*)?येथे\s*(थेट\s*)?भाषण\s*(रूपांतरण|मजकूर|प्रतिसाद)[:\s,.]*/gi,
            /^(चांगले,?\s*)?हे\s*(थेट\s*)?भाषण\s*(रूपांतरण|मजकूर)[:\s,.]*/gi,
            /^मराठीत\s*भाषांतर[:\s,.]*/gi,

            // Tamil prefixes
            /^(சரி,?\s*)?இங்கே\s*(நேரடி\s*)?பேச்சு\s*(மாற்றம்|உரை|பதில்)[:\s,.]*/gi,
            /^(நல்லது,?\s*)?இது\s*(நேரடி\s*)?பேச்சு\s*(மாற்றம்|உரை)[:\s,.]*/gi,
            /^தமிழில்\s*மொழிபெயர்ப்பு[:\s,.]*/gi,

            // Gujarati prefixes
            /^(બરાબર,?\s*)?અહીં\s*(સીધું\s*)?ભાષણ\s*(રૂપાંતરણ|લખાણ|પ્રતિસાદ)[:\s,.]*/gi,
            /^(સારું,?\s*)?આ\s*(સીધું\s*)?ભાષણ\s*(રૂપાંતરણ|લખાણ)[:\s,.]*/gi,
            /^ગુજરાતીમાં\s*અનુવાદ[:\s,.]*/gi,

            // Kannada prefixes
            /^(ಸರಿ,?\s*)?ಇಲ್ಲಿ\s*(ನೇರ\s*)?ಭಾಷಣ\s*(ಪರಿವರ್ತನೆ|ಪಠ್ಯ|ಪ್ರತಿಕ್ರಿಯೆ)[:\s,.]*/gi,
            /^(ಒಳ್ಳೆಯದು,?\s*)?ಇದು\s*(ನೇರ\s*)?ಭಾಷಣ\s*(ಪರಿವರ್ತನೆ|ಪಠ್ಯ)[:\s,.]*/gi,
            /^ಕನ್ನಡದಲ್ಲಿ\s*ಅನುವಾದ[:\s,.]*/gi,

            // Malayalam prefixes
            /^(ശരി,?\s*)?ഇവിടെ\s*(നേരിട്ട്\s*)?പ്രസംഗം\s*(പരിവർത്തനം|വാചകം|പ്രതികരണം)[:\s,.]*/gi,
            /^(നല്ലത്,?\s*)?ഇത്\s*(നേരിട്ട്\s*)?പ്രസംഗം\s*(പരിവർത്തനം|വാചകം)[:\s,.]*/gi,
            /^മലയാളത്തിൽ\s*വിവർത്തനം[:\s,.]*/gi,

            // Punjabi prefixes
            /^(ਠੀਕ ਹੈ,?\s*)?ਇੱਥੇ\s*(ਸਿੱਧਾ\s*)?ਭਾਸ਼ਣ\s*(ਬਦਲਾਅ|ਟੈਕਸਟ|ਜਵਾਬ)[:\s,.]*/gi,
            /^(ਚੰਗਾ,?\s*)?ਇਹ\s*(ਸਿੱਧਾ\s*)?ਭਾਸ਼ਣ\s*(ਬਦਲਾਅ|ਟੈਕਸਟ)[:\s,.]*/gi,
            /^ਪੰਜਾਬੀ\s*ਵਿੱਚ\s*ਅਨੁਵਾਦ[:\s,.]*/gi,

            // Odia prefixes
            /^(ଠିକ୍ ଅଛି,?\s*)?ଏଠାରେ\s*(ସିଧା\s*)?ଭାଷଣ\s*(ପରିବର୍ତ୍ତନ|ପାଠ୍ୟ|ପ୍ରତିକ୍ରିୟା)[:\s,.]*/gi,
            /^(ଭଲ,?\s*)?ଏହା\s*(ସିଧା\s*)?ଭାଷଣ\s*(ପରିବର୍ତ୍ତନ|ପାଠ୍ୟ)[:\s,.]*/gi,
            /^ଓଡ଼ିଆରେ\s*ଅନୁବାଦ[:\s,.]*/gi,

            // Assamese prefixes
            /^(ঠিক আছে,?\s*)?ইয়াত\s*(পোনপটীয়া\s*)?ভাষণ\s*(ৰূপান্তৰ|পাঠ|প্ৰতিক্ৰিয়া)[:\s,.]*/gi,
            /^(ভাল,?\s*)?এয়া\s*(পোনপটীয়া\s*)?ভাষণ\s*(ৰূপান্তৰ|পাঠ)[:\s,.]*/gi,
            /^অসমীয়াত\s*অনুবাদ[:\s,.]*/gi,

            // Urdu prefixes
            /^(ٹھیک ہے,?\s*)?یہاں\s*(براہ راست\s*)?تقریر\s*(تبدیلی|متن|جواب)[:\s,.]*/gi,
            /^(اچھا,?\s*)?یہ\s*(براہ راست\s*)?تقریر\s*(تبدیلی|متن)[:\s,.]*/gi,
            /^اردو\s*میں\s*ترجمہ[:\s,.]*/gi
        ];

        // Apply all unwanted prefix removals
        unwantedPrefixes.forEach(regex => {
            smartText = smartText.replace(regex, '').trim();
        });

        // Additional cleanup for any remaining conversation artifacts
        smartText = smartText
            .replace(/^(sure|okay|alright|right)[,.\s]*/gi, '')
            .replace(/^(ज़रूर|ठीक|अच्छा|सही)[,.\s]*/gi, '')
            .replace(/^(নিশ্চয়|ঠিক|ভাল|সঠিক)[,.\s]*/gi, '')
            .replace(/^(ఖచ్చితంగా|సరే|మంచిది|సరైన)[,.\s]*/gi, '')
            .replace(/^(नक्कीच|ठीक|चांगले|बरोबर)[,.\s]*/gi, '')
            .replace(/^(நிச்சயமாக|சரி|நல்லது|சரியான)[,.\s]*/gi, '')
            .replace(/^(ચોક્કસ|ઠીક|સારું|યોગ્ય)[,.\s]*/gi, '')
            .replace(/^(ಖಂಡಿತ|ಸರಿ|ಒಳ್ಳೆಯದು|ಸರಿಯಾದ)[,.\s]*/gi, '')
            .replace(/^(തീർച്ചയായും|ശരി|നല്ലത്|ശരിയായ)[,.\s]*/gi, '')
            .replace(/^(ਯਕੀਨੀ|ਠੀਕ|ਚੰਗਾ|ਸਹੀ)[,.\s]*/gi, '')
            .replace(/^(ନିଶ୍ଚିତ|ଠିକ୍|ଭଲ|ସଠିକ୍)[,.\s]*/gi, '')
            .replace(/^(নিশ্চিত|ঠিক|ভাল|সঠিক)[,.\s]*/gi, '')
            .replace(/^(یقینی|ٹھیک|اچھا|صحیح)[,.\s]*/gi, '')
            .trim();

        res.json({
            success: true,
            data: {
                originalText: text,
                smartText: smartText,
                language: language
            }
        });

    } catch (error) {
        console.error('Smart speech generation error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to generate smart speech text",
            data: {
                originalText: req.body.text,
                smartText: req.body.text, // Fallback to original
                language: req.body.language || 'en'
            }
        });
    }
};

// Helper function to generate dual responses for general queries
const generateDualResponse = async (genAI, query, language) => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        });

        // Generate speech-optimized response
        const speechPrompt = `You are an expert agricultural advisor specializing in Indian farming practices. 
Provide a concise, conversational response optimized for text-to-speech. Keep it natural and direct, like you're speaking to a farmer face-to-face.

Query: ${query}

${language && language !== 'en' ? `Please respond in ${language} language.` : ''}

Requirements:
- Keep response under 100 words
- Use simple, spoken language
- Be direct and actionable
- Don't use formatting symbols like asterisks (*)
- Don't use bullet points or lists
- Make it sound natural when spoken aloud
- Give practical advice specific to Indian farming

Provide a brief, conversational answer:`;

        // Generate detailed display response
        const displayPrompt = `You are an expert agricultural advisor specializing in Indian farming practices. 
Provide a comprehensive, detailed response optimized for screen display with proper structure and formatting.

Query: ${query}

${language && language !== 'en' ? `Please respond in ${language} language.` : ''}

Requirements:
- Provide detailed, structured information
- Include specific recommendations
- Add relevant context and explanations
- Use clear sections but minimize asterisks (*) - use them sparingly
- Include practical tips and considerations
- Make it informative for reading
- Focus on Indian farming conditions and practices
- Be comprehensive but not overly verbose

Provide a detailed, structured answer:`;

        // Generate both responses in parallel
        const [speechResult, displayResult] = await Promise.all([
            model.generateContent(speechPrompt),
            model.generateContent(displayPrompt)
        ]);

        const speechResponse = await speechResult.response;
        const displayResponse = await displayResult.response;

        return {
            speechAnswer: speechResponse.text().trim(),
            displayAnswer: displayResponse.text().trim()
        };
    } catch (error) {
        console.error('Error generating dual response:', error);
        // Fallback to single response generation
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        });

        const fallbackPrompt = `You are an expert agricultural advisor specializing in Indian farming practices. 
Answer the following farming query in a helpful, practical manner.

Query: ${query}

${language && language !== 'en' ? `Please respond in ${language} language.` : ''}

Requirements:
- Be concise and practical
- Don't use excessive asterisks (*) or formatting symbols
- Focus on actionable advice
- Consider Indian farming conditions and practices

Provide practical, region-specific advice:`;

        const result = await model.generateContent(fallbackPrompt);
        const response = await result.response;
        const answer = response.text().trim();

        return {
            speechAnswer: answer,
            displayAnswer: answer
        };
    }
};
