const { GoogleGenerativeAI } = require("@google/generative-ai");
const Product = require("../models/ProductModel");

// Helper function to detect if query is an instruction vs question
const isInstruction = (query) => {
    const instructionIndicators = [
        // English imperatives
        'add', 'increase', 'decrease', 'reduce', 'set', 'update', 'remove', 'take out', 'put in',

        // Hindi imperatives
        'बढ़ा दो', 'घटा दो', 'कम कर दो', 'ज्यादा कर दो', 'जोड़ दो', 'निकाल दो', 'सेट कर दो',
        'बढ़ाओ', 'घटाओ', 'कम करो', 'ज्यादा करो', 'जोड़ो', 'निकालो', 'सेट करो', 'अपडेट करो',
        'हटाओ', 'हटा दो', 'डालो', 'डाल दो', 'बेचो', 'बेच दो', 'काटो', 'काट दो',

        // Bengali imperatives
        'বাড়াও', 'বাড়িয়ে দাও', 'কমাও', 'কমিয়ে দাও', 'জোড় করো', 'সরাও', 'সরিয়ে দাও',
        'সেট করো', 'সেট কর', 'আপডেট করো', 'আপডেট কর', 'তুলে নাও', 'ফেলে দাও',

        // Telugu imperatives
        'పెంচు', 'పెంచండি', 'తగ్గించు', 'తగ్గించండি', 'జోడించు', 'జোడించండి', 'తీసేయ్', 'తీసెయ్యండি',
        'సెట్ చేయ్', 'సెట్ చేయండి', 'అప్‌డేట్ చేయండి', 'మార్చు', 'మార్చండి',

        // Marathi imperatives
        'वाढवा', 'वाढव', 'घटवा', 'घटव', 'जोडा', 'जोड', 'काढा', 'काढ', 'सेट करा', 'सेट कर',
        'अपडेट करा', 'अपडेट कर', 'बदला', 'बदल',

        // Tamil imperatives
        'கூட्டு', 'கூट्टु', 'குறैच्चु', 'குறैच्चेय्', 'सेट पण्णु', 'सेट पण्णेय्',

        // Gujarati imperatives
        'વધારો', 'વધાર', 'ઘટાડો', 'ઘટાડ', 'જોડો', 'જોડ', 'સેટ કરો', 'સેટ કર',

        // Kannada imperatives
        'ಹೆಚ್ಚಿಸು', 'ಹೆಚ್ಚಿಸಿ', 'ಕಡಿಮೆಮಾಡು', 'ಕಡಿಮೆಮಾಡಿ', 'ಸೇರಿಸು', 'ಸೇರಿಸಿ',

        // Malayalam imperatives
        'കൂട്ടുക', 'കൂട്ടൂ', 'കുറയ്ക്കുക', 'കുറയ്ക്കൂ', 'സെറ്റ് ചെയ്യുക', 'സെറ്റ് ചെയ്യൂ',

        // Punjabi imperatives
        'ਵਧਾਓ', 'ਵਧਾ', 'ਘਟਾਓ', 'ਘਟਾ', 'ਜੋੜੋ', 'ਜੋੜ', 'ਸੈੱਟ ਕਰੋ',

        // Urdu imperatives
        'بڑھاؤ', 'بڑھا', 'کم کرو', 'کم کر', 'جوڑو', 'جوڑ', 'سیٹ کرو'
    ];

    // Question indicators
    const questionIndicators = [
        // English
        'how much', 'how many', 'what is', 'what are', 'do i have', 'show me', 'tell me',

        // Hindi
        'कितना', 'कितनी', 'कितने', 'क्या है', 'मेरे पास', 'दिखाओ', 'बताओ', 'कहाँ है',

        // Bengali
        'কত', 'কতটুকু', 'কি আছে', 'দেখাও', 'বলো', 'কোথায়',

        // Telugu
        'ఎంత', 'ఎన్ని', 'ఏమిటి', 'చూపించు', 'చెప్పు', 'ఎక్కడ',

        // Marathi
        'किती', 'काय आहे', 'दाखवा', 'सांगा', 'कुठे आहे'
    ];

    const lowerQuery = query.toLowerCase();

    // Check for question words first (questions have priority in ambiguous cases)
    const hasQuestionWords = questionIndicators.some(indicator =>
        lowerQuery.includes(indicator.toLowerCase())
    );

    if (hasQuestionWords) {
        return false; // It's a question
    }

    // Check for instruction words
    const hasInstructionWords = instructionIndicators.some(indicator =>
        lowerQuery.includes(indicator.toLowerCase())
    );

    return hasInstructionWords;
};

// Helper function to detect inventory update queries in multiple languages
const isInventoryUpdateQuery = (query) => {
    const updateKeywords = [
        // English (expanded with more patterns)
        'update', 'modify', 'change', 'adjust', 'edit', 'increase', 'decrease', 'reduce', 'add to', 'add in',
        'add', 'remove', 'subtract', 'set', 'make', 'take out', 'sold', 'harvest', 'picked', 'put in',
        'collected', 'used', 'consumed', 'wasted', 'damaged', 'spoiled', 'expired', 'from stock', 'to stock',
        'delivered', 'shipped', 'supplied', 'dumped', 'lost', 'burnt', 'rotten', 'destroyed', 'में से', 'में',

        // Hinglish & spoken forms (expanded)
        'bech diya', 'becha', 'bech do', 'add karo', 'add kar do', 'nikal diya', 'nikal do', 'ghatao', 'ghata do', 'badhao', 'badha do',
        'kat gaya', 'kat liya', 'kat chuka', 'use kiya', 'use kar do', 'khatam ho gaya', 'kha gaya', 'kam karo', 'kam kar do',
        'fek diya', 'saara gaya', 'dal diya', 'dal do', 'bacha nahi', 'kharab ho gaya', 'pura bech diya', 'jyada karo', 'jyada kar do',
        'mila', 'mil gaya', 'wapas mila', 'de diya', 'utha liya', 'khaali ho gaya', 'set karo', 'set kar do', 'update karo',

        // ✅ Hindi (expanded native script with imperative forms)
        'अपडेट', 'बदलना', 'बदलाव', 'घटाना', 'घटाओ', 'घटा दो', 'कम करना', 'कम करो', 'कम कर दो', 'कम',
        'बढ़ाना', 'बढ़ाओ', 'बढ़ा दो', 'ज्यादा करना', 'ज्यादा करो', 'ज्यादा कर दो', 'अधिक करो', 'अधिक कर दो',
        'सेट', 'सेट करो', 'सेट कर दो', 'हटाना', 'हटाओ', 'हटा दो', 'निकालना', 'निकालो', 'निकाल दिया', 'निकाल दो',
        'बेचना', 'बेच दिया', 'बेचो', 'बेच दो', 'काटना', 'काट दिया', 'काटो', 'काट दो', 'तोड़ा', 'तोड़ो', 'तोड़ दो',
        'इस्तेमाल करना', 'इस्तेमाल किया', 'इस्तेमाल करो', 'उपयोग करो', 'खराब', 'सड़ा', 'जोड़ो', 'जोड़ दो',
        'समाप्त', 'ख़त्म', 'खत्म हो गया', 'दिया', 'भेजा', 'नष्ट', 'फेंका', 'फेंक दिया', 'डालो', 'डाल दो',

        // Bengali (expanded with imperatives)
        'কমাও', 'কমিয়ে দাও', 'বাড়াও', 'বাড়িয়ে দাও', 'সরাও', 'সরিয়ে দাও', 'উঠাও', 'উঠিয়ে নাও',
        'বিক্রি করো', 'বিক্রি কর', 'ব্যবহার করো', 'ব্যবহার কর', 'ফেলে দাও', 'ফেল', 'নষ্ট হয়ে গেছে',
        'শেষ হয়ে গেছে', 'দিয়ে দাও', 'দাও', 'নষ্ট', 'শেষ', 'কাট', 'কেটে দাও', 'তোল', 'তুলে নাও', 'খারাপ',
        'যোগ করো', 'যোগ কর', 'বিয়োগ করো', 'বিয়োগ কর', 'সেট করো', 'সেট কর',

        // Telugu (expanded with imperatives)
        'తగ్గించండి', 'తగ్గించు', 'తగ్గించేయ్', 'పెంచండి', 'పెంచు', 'పెంచేయ్', 'తీసెయ్యండి', 'తీసేయ్', 'తీయండి',
        'అమ్మండి', 'అమ్ము', 'అమ్మేయ్', 'వాడండి', 'వాడు', 'వాడేయ్', 'కత్తిరించండి', 'కత్తిరించు', 'పంపండి', 'పంపు',
        'చెడ్డది', 'ఖతం', 'వెళ్లిపోయింది', 'తగ్గు', 'పెంచు', 'తీసు', 'వాడు', 'జోడించు', 'జోడించండి',
        'సెట్ చేయండి', 'సెట్ చేయ్', 'అప్‌డేట్ చేయండి', 'మార్చండి', 'మార్చు',

        // Marathi (expanded with imperatives)
        'घटवा', 'घटव', 'कमी करा', 'कमी कर', 'वाढवा', 'वाढव', 'जास्त करा', 'जास्त कर', 'काढा', 'काढ',
        'विकली', 'विका', 'विक', 'कापली', 'कापा', 'काप', 'वापरली', 'वापरा', 'वापर', 'खराब', 'संपली', 'संपवा',
        'फेकली', 'फेका', 'फेक', 'गेली', 'नष्ट', 'दिली', 'दे', 'द्या', 'पाठवली', 'पाठवा', 'पाठव',
        'उपयोग केला', 'उपयोग करा', 'उपयोग कर', 'जोडा', 'जोड', 'सेट करा', 'सेट कर',

        // Tamil
        'குறைச்சு', 'அதிகச்சு', 'வாங்கினேன்', 'விற்றேன்', 'கழித்தேன்', 'அறுத்தேன்', 'பயன்படுத்தினேன்',
        'அனுப்பினேன்', 'கெட்டது', 'முடிந்தது', 'போகட்டும்', 'நஷ்டம்', 'அழித்தேன்',

        // Gujarati
        'ઘટાડો', 'વધારો', 'કાઢો', 'વેચી નાખ્યું', 'વાપર્યું', 'કાપ્યું', 'ખરાબ', 'ફેંકી દીધું', 'નાશ',
        'મોકલી', 'સમાપ્ત', 'નષ્ટ', 'દઈ દીધું', 'હટાવ્યું',

        // Kannada
        'ಕಡಿಮೆಮಾಡು', 'ಹೆಚ್ಚಿಸು', 'ತೆಗೆದುಹಾಕು', 'ಮಾರಿದೆ', 'ಬಳಸಿದೆ', 'ಕತ್ತರಿಸಿದೆ', 'ಹಾಳಾಗಿದೆ',
        'ಕೊಟ್ಟಿದ್ದೇನೆ', 'ಕಳುಹಿಸಿದ್ದೇನೆ', 'ನಷ್ಟವಾಗಿದೆ', 'ತೊಡಗಿಸಲಾಗಿದೆ', 'ಮುಕ್ತವಾಗಿದೆ',

        // Malayalam
        'കുറയ്ക്കുക', 'കൂട്ടുക', 'എടുത്തു', 'വാങ്ങിയതും', 'ഉപയോഗിച്ചു', 'വില്പന', 'വിറ്റു',
        'കഴിഞ്‌ഞു', 'മറക്കുക', 'അവസാനിച്ചു', 'പോകട്ടെ', 'നഷ്ടപ്പെട്ടു', 'കൊടുത്തു', 'കണ്ടില്ല',

        // Punjabi
        'ਘਟਾਓ', 'ਵਧਾਓ', 'ਕੱਢੋ', 'ਵਿੱਚਿਆ', 'ਕੱਟਿਆ', 'ਵਰਤਿਆ', 'ਦਿੱਤਾ', 'ਖਤਮ ਹੋ ਗਿਆ',
        'ਭੇਜਿਆ', 'ਨਿਕਲ ਗਿਆ', 'ਖਰਾਬ', 'ਮਾਰਿਆ', 'ਸਾਫ਼ ਕੀਤਾ', 'ਹਟਾਇਆ',

        // Odia
        'କମାନ୍ତୁ', 'ଅଧିକ କରନ୍ତୁ', 'କାଢ଼ନ୍ତୁ', 'ବିକ୍ରି', 'ବ୍ୟବହାର', 'ଖରାପ', 'ଦେଲି', 'ପଠାଇଲି',
        'ନଷ୍ଟ', 'ଅପଚୟ', 'ଖତମ', 'ଫେଙ୍କିଦିଅ', 'ସମାପ୍ତ',

        // Assamese
        'কমাওক', 'বঢ়াওক', 'উলিয়াওক', 'বিক্ৰী', 'ব্যৱহাৰ', 'নষ্ট', 'শেষ', 'পঠিয়ালোঁ',
        'ফেকি দিলোঁ', 'ভাঙি গ’ল', 'নষ্ঠ', 'দিয়া', 'ল’লোঁ',

        // Urdu
        'کم کرو', 'زیادہ کرو', 'نکالو', 'بیچو', 'استعمال کیا', 'خراب ہو گیا', 'ختم',
        'پھینک دیا', 'نکال دیا', 'دیا', 'بھیجا', 'ضائع', 'نقصان', 'خالی ہو گیا', 'جل گیا'
    ];


    return updateKeywords.some(keyword =>
        query.toLowerCase().includes(keyword.toLowerCase())
    );
};

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

// Helper function to parse inventory update using Gemini AI
const parseInventoryUpdate = async (query, language, genAI) => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 200,
            }
        });

        const parsePrompt = `
Parse this inventory update instruction and extract the following information:
1. Product name (in English)
2. Action (increase, decrease, set)
3. Quantity (number only)
4. Unit (if mentioned, otherwise return null)

The query is an INSTRUCTION to update inventory. Understand the meaning and extract:
- Product names (translate to English if needed)
- Action words like: बढ़ा दो (add/increase), घटा दो (reduce/decrease), कम कर दो (reduce), ज्यादा कर दो (increase), 
  सेट कर दो (set), add, increase, decrease, reduce, subtract, sold, used, take out, harvest, collected, set, update
- Numerical values (including written numbers like दो=2, पांच=5, etc.)
- Units like kg, किलो, lb, pieces, boxes, etc.

Examples:
"स्टॉक में आम 2 किलो बढ़ा दो" -> productName: "mango", action: "increase", quantity: 2, unit: "kg"
"आम में 2 किलो बढ़ा दो" -> productName: "mango", action: "increase", quantity: 2, unit: "kg"  
"उपलब्ध आम में से 2 किलो घटा दो" -> productName: "mango", action: "decrease", quantity: 2, unit: "kg"
"टमाटर 5 किलो कम कर दो" -> productName: "tomato", action: "decrease", quantity: 5, unit: "kg"
"Add 3 kg to rice" -> productName: "rice", action: "increase", quantity: 3, unit: "kg"

Query: "${query}"

IMPORTANT: 
- For actions: use "decrease" for reducing/selling/using/घटाना/कम करना, "increase" for adding/harvesting/बढ़ाना/ज्यादा करना, "set" for setting specific amount/सेट करना
- Convert written numbers to digits (दो=2, तीन=3, चार=4, पांच=5, etc.)
- If the product name is generic, return the generic name
- If it's specific variety, return the specific name

Return ONLY a JSON object in this exact format:
{
  "productName": "product_name_in_english",
  "action": "increase|decrease|set",
  "quantity": number,
  "unit": "unit_or_null",
  "confidence": 0.0-1.0
}`;

        const result = await model.generateContent(parsePrompt);
        const response = await result.response;
        const text = response.text().trim();

        try {
            // Extract JSON from the response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    productName: parsed.productName?.toLowerCase() || null,
                    action: parsed.action || null,
                    quantity: parsed.quantity || null,
                    unit: parsed.unit || null,
                    confidence: parsed.confidence || 0.5
                };
            }
        } catch (parseError) {
            // JSON parsing failed
        }

        return null;
    } catch (error) {
        return null;
    }
};

// Helper function to find matching products for inventory update
const findMatchingProducts = async (farmerId, productName) => {
    try {
        const query = {
            farmer: farmerId,
            isActive: true,
            name: { $regex: productName, $options: 'i' }
        };

        const products = await Product.find(query)
            .select('name quantityAvailable unit price category')
            .populate('category', 'name')
            .sort({ name: 1 });

        return products;
    } catch (error) {
        console.error('Error finding matching products:', error);
        return [];
    }
};

// Helper function to update product inventory
const updateProductInventory = async (productId, action, quantity, farmerId) => {
    try {
        const product = await Product.findOne({
            _id: productId,
            farmer: farmerId,
            isActive: true
        });

        if (!product) {
            return { success: false, message: "Product not found or access denied" };
        }

        let newQuantity;
        switch (action) {
            case 'increase':
                newQuantity = product.quantityAvailable + quantity;
                break;
            case 'decrease':
                newQuantity = Math.max(0, product.quantityAvailable - quantity);
                break;
            case 'set':
                newQuantity = Math.max(0, quantity);
                break;
            default:
                return { success: false, message: "Invalid action" };
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { quantityAvailable: newQuantity },
            { new: true, runValidators: true }
        ).populate('category', 'name');

        return {
            success: true,
            product: updatedProduct,
            oldQuantity: product.quantityAvailable,
            newQuantity: newQuantity,
            change: newQuantity - product.quantityAvailable
        };
    } catch (error) {
        console.error('Error updating product inventory:', error);
        return { success: false, message: "Failed to update inventory" };
    }
};

// Helper function to generate inventory update response
const generateInventoryUpdateResponse = async (updateResult, originalQuery, language, genAI) => {
    try {
        if (!updateResult.success) {
            const errorMessage = updateResult.message || "Failed to update inventory";

            if (language && language !== 'en') {
                return await translateResponse(errorMessage, language, genAI);
            }
            return errorMessage;
        }

        const { product, oldQuantity, newQuantity, change } = updateResult;
        const action = change > 0 ? 'increased' : change < 0 ? 'decreased' : 'set';

        let response = `Successfully updated ${product.name} inventory. `;
        response += `Quantity ${action} from ${oldQuantity} ${product.unit} to ${newQuantity} ${product.unit}. `;

        if (change !== 0) {
            response += `Change: ${change > 0 ? '+' : ''}${change} ${product.unit}. `;
        }

        response += `Current stock value: ₹${(newQuantity * product.price).toFixed(2)}.`;

        if (language && language !== 'en') {
            return await translateResponse(response, language, genAI);
        }

        return response;
    } catch (error) {
        console.error('Error generating inventory update response:', error);
        return "Inventory updated successfully.";
    }
};

// Helper function to handle disambiguation when multiple products match
const generateDisambiguationResponse = async (products, originalQuery, language, genAI) => {
    try {
        let response = "I found multiple products matching your query. Please specify which one you want to update:\n\n";

        products.forEach((product, index) => {
            response += `${index + 1}. ${product.name} (${product.quantityAvailable} ${product.unit} available)\n`;
        });

        response += "\nPlease specify the exact product name or mention more details.";

        if (language && language !== 'en') {
            return await translateResponse(response, language, genAI);
        }

        return response;
    } catch (error) {
        console.error('Error generating disambiguation response:', error);
        return "Multiple products found. Please be more specific.";
    }
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
TASK: Translate farming text to ${languageNames[targetLanguage] || targetLanguage}.

RULES:
- Start immediately with translated content (NO "Translation:", "अनुवाद:", etc.)
- Keep: product names, numbers, ₹ symbols, dates
- Be natural and conversational
- Use proper farming terms

Text: "${text}"

${languageNames[targetLanguage] || targetLanguage} version:`;

        const translateResult = await model.generateContent(translatePrompt);
        const translateResponse = await translateResult.response;
        let translatedText = translateResponse.text().trim();

        // Clean up any translation prefixes
        translatedText = translatedText
            .replace(/^(translation\s*in\s*\w+)[:\s,.]*/gi, '')
            .replace(/^(अनुवाद)[:\s,.]*/gi, '')
            .replace(/^(অনুবাদ)[:\s,.]*/gi, '')
            .replace(/^(అనువాదం)[:\s,.]*/gi, '')
            .replace(/^(भाषांतर)[:\s,.]*/gi, '')
            .replace(/^(மொழிபெயர்ப்பு)[:\s,.]*/gi, '')
            .replace(/^(અનુવાદ)[:\s,.]*/gi, '')
            .replace(/^(ಅನುವಾದ)[:\s,.]*/gi, '')
            .replace(/^(പരിഭാഷ)[:\s,.]*/gi, '')
            .replace(/^(ਅਨੁਵਾਦ)[:\s,.]*/gi, '')
            .replace(/^(ଅନୁବାଦ)[:\s,.]*/gi, '')
            .replace(/^(অনুবাদ)[:\s,.]*/gi, '')
            .replace(/^(ترجمہ)[:\s,.]*/gi, '')
            .replace(/^[:\-\s]*/, '')
            .trim();

        return translatedText;
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

        // Check if this is an inventory update query
        if (isInventoryUpdateQuery(query)) {
            // First check if it's an instruction vs question
            if (!isInstruction(query)) {
                // It's a question about inventory, not an instruction to update
                // Handle as stock query instead
                try {
                    const productName = await extractProductFromQuery(query, language, genAI);
                    const products = await getFarmerStock(farmerId, productName);

                    const speechResponse = formatStockResponseForSpeech(products, query, productName);
                    const displayResponse = formatStockResponseForDisplay(products, query, productName);

                    let finalSpeechResponse = speechResponse;
                    if (language && language !== 'en') {
                        finalSpeechResponse = await translateResponse(speechResponse, language, genAI);
                    }

                    return res.json({
                        success: true,
                        data: {
                            query: query,
                            answer: finalSpeechResponse,
                            speechAnswer: finalSpeechResponse,
                            displayAnswer: displayResponse,
                            language: language || 'en',
                            type: 'stock_inquiry',
                            hasDisplayData: true
                        }
                    });
                } catch (stockError) {
                    console.error('Stock query error:', stockError);
                    const errorMessage = language && language !== 'en'
                        ? await translateResponse("Sorry, I couldn't fetch your stock information at the moment.", language, genAI)
                        : "Sorry, I couldn't fetch your stock information at the moment.";

                    return res.json({
                        success: true,
                        data: {
                            query: query,
                            answer: errorMessage,
                            speechAnswer: errorMessage,
                            displayAnswer: errorMessage,
                            language: language || 'en',
                            type: 'error',
                            hasDisplayData: false
                        }
                    });
                }
            }

            // It's an instruction to update inventory
            try {
                // Parse the inventory update request
                const updateRequest = await parseInventoryUpdate(query, language, genAI);

                if (!updateRequest || !updateRequest.productName || !updateRequest.action || !updateRequest.quantity) {
                    const clarificationMessage = language && language !== 'en'
                        ? await translateResponse("I couldn't understand your inventory update instruction. Please specify the product name, action (increase/decrease/set), and quantity clearly. For example: 'Add 5 kg to tomatoes' or 'आम में 2 किलो बढ़ा दो'", language, genAI)
                        : "I couldn't understand your inventory update instruction. Please specify the product name, action (increase/decrease/set), and quantity clearly. For example: 'Add 5 kg to tomatoes' or 'आम में 2 किलो बढ़ा दो'";

                    return res.json({
                        success: true,
                        data: {
                            query: query,
                            answer: clarificationMessage,
                            speechAnswer: clarificationMessage,
                            displayAnswer: clarificationMessage,
                            language: language || 'en',
                            type: 'clarification_needed',
                            hasDisplayData: false
                        }
                    });
                }

                // Find matching products
                const matchingProducts = await findMatchingProducts(farmerId, updateRequest.productName);

                if (matchingProducts.length === 0) {
                    const notFoundMessage = language && language !== 'en'
                        ? await translateResponse(`No products found matching "${updateRequest.productName}". Please check the product name and try again.`, language, genAI)
                        : `No products found matching "${updateRequest.productName}". Please check the product name and try again.`;

                    return res.json({
                        success: true,
                        data: {
                            query: query,
                            answer: notFoundMessage,
                            speechAnswer: notFoundMessage,
                            displayAnswer: notFoundMessage,
                            language: language || 'en',
                            type: 'product_not_found',
                            hasDisplayData: false
                        }
                    });
                }

                // If multiple products match and the request is generic, ask for clarification
                if (matchingProducts.length > 1 && updateRequest.confidence < 0.8) {
                    const disambiguationResponse = await generateDisambiguationResponse(matchingProducts, query, language, genAI);

                    return res.json({
                        success: true,
                        data: {
                            query: query,
                            answer: disambiguationResponse,
                            speechAnswer: disambiguationResponse,
                            displayAnswer: {
                                message: disambiguationResponse,
                                products: matchingProducts.map(p => ({
                                    id: p._id,
                                    name: p.name,
                                    quantity: p.quantityAvailable,
                                    unit: p.unit,
                                    price: p.price
                                }))
                            },
                            language: language || 'en',
                            type: 'disambiguation_needed',
                            hasDisplayData: true
                        }
                    });
                }

                // Use the first (most relevant) product for update
                const targetProduct = matchingProducts[0];

                // Update the inventory
                const updateResult = await updateProductInventory(
                    targetProduct._id,
                    updateRequest.action,
                    updateRequest.quantity,
                    farmerId
                );

                // Generate response
                const responseMessage = await generateInventoryUpdateResponse(updateResult, query, language, genAI);

                return res.json({
                    success: true,
                    data: {
                        query: query,
                        answer: responseMessage,
                        speechAnswer: responseMessage,
                        displayAnswer: updateResult.success ? {
                            message: responseMessage,
                            product: {
                                id: updateResult.product._id,
                                name: updateResult.product.name,
                                oldQuantity: updateResult.oldQuantity,
                                newQuantity: updateResult.newQuantity,
                                change: updateResult.change,
                                unit: updateResult.product.unit,
                                price: updateResult.product.price,
                                currentValue: (updateResult.newQuantity * updateResult.product.price).toFixed(2)
                            }
                        } : responseMessage,
                        language: language || 'en',
                        type: 'inventory_update',
                        hasDisplayData: updateResult.success,
                        updateSuccess: updateResult.success
                    }
                });
            } catch (updateError) {
                console.error('Inventory update error:', updateError);
                // Fall through to regular AI query if update fails
            }
        }

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
                en: "Reduce mango stock by 2 kg",
                hi: "आम का स्टॉक 2 किलो कम करें",
                bn: "আম স্টক ২ কেজি কমান",
                te: "మామిడి స్టాక్‌ను 2 కిలోలు తగ్గించండి",
                mr: "आंब्याचा साठा 2 किलो कमी करा",
                ta: "மாம்பழ ஸ்டாக்கை 2 கிலோ குறைக்கவும்",
                gu: "કેરીનો સ્ટોક 2 કિલો ઘટાડો",
                kn: "ಮಾವಿನ ಸ್ಟಾಕ್ ಅನ್ನು 2 ಕಿಲೋ ಕಡಿಮೆ ಮಾಡಿ",
                ml: "മാമ്പഴ സ്റ്റോക്ക് 2 കിലോ കുറയ്ക്കുക",
                pa: "ਅੰਬ ਦਾ ਸਟਾਕ 2 ਕਿਲੋ ਘਟਾਓ",
                or: "ଆମ୍ବ ଷ୍ଟକ୍ 2 କିଲୋ କମ୍ କରନ୍ତୁ",
                as: "আম ষ্টক ২ কিলো কমাওক",
                ur: "آم کا اسٹاک 2 کلو کم کریں"
            },
            {
                en: "Add 5 kg harvested tomatoes to inventory",
                hi: "5 किलो काटे गए टमाटर स्टॉक में जोड़ें",
                bn: "5 কেজি কাটা টমেটো স্টকে যোগ করুন",
                te: "5 కిలోల కోసిన టమాటాలను స్టాక్‌లో జోడించండి",
                mr: "5 किलो कापलेले टोमॅटो साठ्यात जोडा",
                ta: "5 கிலோ அறுவடை செய்த தக்காளியை ஸ்டாக்கில் சேர்க்கவும்",
                gu: "5 કિલો કાપેલા ટમેટા સ્ટોકમાં ઉમેરો",
                kn: "5 ಕಿಲೋ ಕೊಯ್ದ ಟೊಮೇಟೊಗಳನ್ನು ಸ್ಟಾಕ್‌ಗೆ ಸೇರಿಸಿ",
                ml: "5 കിലോ കൊയ്ത തക്കാളി സ്റ്റോക്കിൽ ചേർക്കുക",
                pa: "5 ਕਿਲੋ ਕਟੇ ਟਮਾਟਰ ਸਟਾਕ ਵਿੱਚ ਜੋੜੋ",
                or: "5 କିଲୋ କଟା ଟମାଟୋ ଷ୍ଟକରେ ଯୋଗ କରନ୍ତୁ",
                as: "5 কিলো কটা টমেটো ষ্টকত যোগ কৰক",
                ur: "5 کلو کاٹے گئے ٹماٹر اسٹاک میں شامل کریں"
            },
            {
                en: "I sold 3 kg onions, update my stock",
                hi: "मैंने 3 किलो प्याज बेचे, मेरा स्टॉक अपडेट करें",
                bn: "আমি 3 কেজি পেঁয়াজ বিক্রি করেছি, আমার স্টক আপডেট করুন",
                te: "నేను 3 కిలోల ఉల్లిపాయలు అమ్మాను, నా స్టాక్‌ను అప్‌డేట్ చేయండి",
                mr: "मी 3 किलो कांदे विकले, माझा साठा अद्ययावत करा",
                ta: "நான் 3 கிலோ வெங்காயம் விற்றேன், எனது ஸ்டாக்கை புதுப்பிக்கவும்",
                gu: "મેં 3 કિલો ડુંગળી વેચ્યા, મારો સ્ટોક અપડેટ કરો",
                kn: "ನಾನು 3 ಕಿಲೋ ಈರುಳ್ಳಿ ಮಾರಿದೆ, ನನ್ನ ಸ್ಟಾಕ್ ಅಪ್‌ಡೇಟ್ ಮಾಡಿ",
                ml: "ഞാൻ 3 കിലോ ഉള്ളി വിറ്റു, എന്റെ സ്റ്റോക്ക് അപ്ഡേറ്റ് ചെയ്യുക",
                pa: "ਮੈਂ 3 ਕਿਲੋ ਪਿਆਜ਼ ਵੇਚੇ, ਮੇਰਾ ਸਟਾਕ ਅਪਡੇਟ ਕਰੋ",
                or: "ମୁଁ 3 କିଲୋ ପିଆଜ ବିକ୍ରି କଲି, ମୋର ଷ୍ଟକ୍ ଅପଡେଟ୍ କରନ୍ତୁ",
                as: "মই 3 কিলো পিয়াজ বিক্ৰী কৰিলোঁ, মোৰ ষ্টক আপডেট কৰক",
                ur: "میں نے 3 کلو پیاز بیچے، میرا اسٹاک اپڈیٹ کریں"
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
ROLE: You are a farmer speaking directly to another farmer.

TASK: Convert this text to natural speech in ${targetLanguage}. 

CRITICAL: START IMMEDIATELY with actual content. NO introductions, explanations, or meta-commentary.

BAD Examples:
❌ "Here's the English conversion..."
❌ "यहाँ हिंदी में अनुवाद है..."
❌ "Natural direct speech in English:"
❌ "The translation is..."

GOOD Examples:
✅ "You have fifty kilograms of rice..."
✅ "आपके पास पचास किलो चावल है..."
✅ "আপনার কাছে পঞ্চাশ কিলো চাল আছে..."

RULES:
- Be direct: "You have..." / "आपके पास..." / "আপনার..."
- Convert numbers to words: "50" → "fifty" / "पचास" / "পঞ্চাশ"
- Include quantities, prices, dates
- Be conversational but complete

Text: "${text}"

Response (${targetLanguage}, direct content only):
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

        // Final aggressive cleanup for meta-commentary
        smartText = smartText
            // Remove meta-commentary about conversation/translation
            .replace(/^(direct\s*speech\s*in\s*\w+)[:\s,.]*/gi, '')
            .replace(/^(प्रत्यक्ष\s*भाषण)[:\s,.]*/gi, '')
            .replace(/^(সরাসরি\s*বক্তৃতা)[:\s,.]*/gi, '')
            .replace(/^(ప్రత్యక్ష\s*ప్రసంగం)[:\s,.]*/gi, '')
            .replace(/^(थेट\s*भाषण)[:\s,.]*/gi, '')
            .replace(/^(நேரடি\s*பேச்சு)[:\s,.]*/gi, '')
            .replace(/^(સીધું\s*ભાષણ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(നേരിട്ടുള്ള\s*പ്രസംഗം)[:\s,.]*/gi, '')
            .replace(/^(ਸਿੱਧਾ\s*ਭਾਸ਼ਣ)[:\s,.]*/gi, '')
            .replace(/^(ସିଧା\s*ଭାଷଣ)[:\s,.]*/gi, '')
            .replace(/^(পোনপটীয়া\s*ভাষণ)[:\s,.]*/gi, '')
            .replace(/^(براہ\s*راست\s*تقریر)[:\s,.]*/gi, '')

            // Remove any remaining colons or markers at the start
            .replace(/^[:\-\s]*/, '')
            .trim();

        // Enhanced cleanup for meta-commentary and unwanted prefixes
        const unwantedPrefixes = [
            // English prefixes (Comprehensive)
            /^(ok,?\s*)?here'?s?\s*(the\s*)?(english\s*)?(direct\s*)?speech\s*(conversion|text|response)[:\s,.]*/gi,
            /^(ok,?\s*)?here\s*is\s*(the\s*)?(english\s*)?(direct\s*)?speech\s*(conversion|text|response)[:\s,.]*/gi,
            /^(alright,?\s*)?here'?s?\s*(your\s*)?(english\s*)?(direct\s*)?speech\s*(conversion|text|response)[:\s,.]*/gi,
            /^(sure,?\s*)?here'?s?\s*(the\s*)?(english\s*)?(converted\s*)?speech[:\s,.]*/gi,
            /^(ok,?\s*)?natural,?\s*direct\s*speech\s*in\s*\w+[:\s,.]*/gi,
            /^(here'?s?\s*)?the\s*natural,?\s*direct\s*speech[:\s,.]*/gi,
            /^translation\s*in\s*\w+[:\s,.]*/gi,
            /^natural,?\s*direct\s*speech\s*in\s*\w+[:\s,.]*/gi,
            /^(here'?s?\s*)?the\s*english\s*conversion[:\s,.]*/gi,
            /^english\s*conversion\s*of[:\s,.]*/gi,
            /^the\s*provided\s*statement[:\s,.]*/gi,
            /^into\s*natural\s*direct\s*speech[:\s,.]*/gi,
            /^adhering\s*to\s*all\s*(the\s*)?requirements[:\s,.]*/gi,
            /^(here'?s?\s*)?the\s*\w+\s*conversion\s*of\s*the\s*provided\s*statement[:\s,.]*/gi,
            /^response\s*\(\w+,?\s*direct\s*content\s*only\)[:\s,.]*/gi,
            /^direct\s*content\s*only[:\s,.]*/gi,

            // Hindi prefixes (Enhanced)
            /^(ठीक है,?\s*)?यहाँ\s*(प्रत्यक्ष\s*)?भाषण\s*(रूपांतरण|पाठ|प्रतिक्रिया)\s*(है|हैं?)[:\s,.]*/gi,
            /^(ठीक,?\s*)?यह\s*(प्रत्यक्ष\s*)?भाषण\s*(रूपांतरण|पाठ|प्रतिक्रिया)\s*(है|हैं?)[:\s,.]*/gi,
            /^(अच्छा,?\s*)?यहाँ\s*(आपका\s*)?भाषण\s*(रूपांतरण|पाठ)\s*(है|हैं?)[:\s,.]*/gi,
            /^हिंदी\s*में\s*अनुवाद[:\s,.]*/gi,
            /^हिंदी\s*में\s*(प्राकृतिक|प्रत्यक्ष)\s*भाषण[:\s,.]*/gi,
            /^प्रदान\s*किए\s*गए\s*कथन\s*का[:\s,.]*/gi,
            /^अंग्रेजी\s*रूपांतरण[:\s,.]*/gi,

            // Bengali prefixes (Enhanced)
            /^(ঠিক আছে,?\s*)?এখানে\s*(সরাসরি\s*)?বক্তৃতা\s*(রূপান্তর|পাঠ|প্রতিক্রিয়া)[:\s,.]*/gi,
            /^(ভাল,?\s*)?এই\s*(সরাসরি\s*)?বক্তৃতা\s*(রূপান্তর|পাঠ)[:\s,.]*/gi,
            /^বাংলায়\s*অনুবাদ[:\s,.]*/gi,
            /^বাংলায়\s*(প্রাকৃতিক|সরাসরি)\s*বক্তৃতা[:\s,.]*/gi,
            /^প্রদত্ত\s*বিবৃতির[:\s,.]*/gi,
            /^ইংরেজি\s*রূপান্তর[:\s,.]*/gi,

            // Telugu prefixes (Enhanced)
            /^(సరే,?\s*)?ఇక్కడ\s*(ప్రత్యక్ష\s*)?ప్రసంగం\s*(మార్పిడి|వచనం|ప్రతిస్పందన)[:\s,.]*/gi,
            /^(మంచిది,?\s*)?ఇది\s*(ప్రత్యక్ష\s*)?ప్రసంగం\s*(మార్పిడి|వచనం)[:\s,.]*/gi,
            /^తెలుగులో\s*అనువాదం[:\s,.]*/gi,
            /^అందించిన\s*ప్రకటన[:\s,.]*/gi,
            /^ఆంగ్ల\s*మార్పిడి[:\s,.]*/gi,

            // Marathi prefixes (Enhanced)
            /^(ठीक आहे,?\s*)?येथे\s*(थेट\s*)?भाषण\s*(रूपांतरण|मजकूर|प्रतिसाद)[:\s,.]*/gi,
            /^(चांगले,?\s*)?हे\s*(थेट\s*)?भाषण\s*(रूपांतरण|मजकूर)[:\s,.]*/gi,
            /^मराठीत\s*भाषांतर[:\s,.]*/gi,
            /^प्रदान\s*केलेले\s*विधान[:\s,.]*/gi,
            /^इंग्रजी\s*रूपांतरण[:\s,.]*/gi,

            // Tamil prefixes (Enhanced)
            /^(சரி,?\s*)?இங்கே\s*(நேரடி\s*)?பேச்சு\s*(மாற்றம்|உரை|பதில்)[:\s,.]*/gi,
            /^(நல்லது,?\s*)?இது\s*(நேரடி\s*)?பேச்சு\s*(மாற்றம்|உரை)[:\s,.]*/gi,
            /^தமிழில்\s*மொழிபெயர்ப்பு[:\s,.]*/gi,
            /^வழங்கப்பட்ட\s*அறிக்கை[:\s,.]*/gi,
            /^ஆங்கில\s*மாற்றம்[:\s,.]*/gi,

            // Gujarati prefixes (Enhanced)
            /^(બરાબર,?\s*)?અહીં\s*(સીધું\s*)?ભાષણ\s*(રૂપાંતરણ|લખાણ|પ્રતિસાદ)[:\s,.]*/gi,
            /^(સારું,?\s*)?આ\s*(સીધું\s*)?ભાષણ\s*(રૂપાંતરણ|લખાણ)[:\s,.]*/gi,
            /^ગુજરાતીમાં\s*અનુવાદ[:\s,.]*/gi,
            /^પ્રદાન\s*કરેલ\s*નિવેદન[:\s,.]*/gi,
            /^અંગ્રેજી\s*રૂપાંતરણ[:\s,.]*/gi,

            // Kannada prefixes (Enhanced)
            /^(ಸರಿ,?\s*)?ಇಲ್ಲಿ\s*(ನೇರ\s*)?ಭಾಷಣ\s*(ಪರಿವರ್ತನೆ|ಪಠ್ಯ|ಪ್ರತಿಕ್ರಿಯೆ)[:\s,.]*/gi,
            /^(ಒಳ್ಳೆಯದು,?\s*)?ಇದು\s*(ನೇರ\s*)?ಭಾಷಣ\s*(ಪರಿವರ್ತನೆ|ಪಠ್ಯ)[:\s,.]*/gi,
            /^ಕನ್ನಡದಲ್ಲಿ\s*ಅನುವಾದ[:\s,.]*/gi,
            /^ಒದಗಿಸಿದ\s*ಹೇಳಿಕೆ[:\s,.]*/gi,
            /^ಇಂಗ್ಲಿಷ್\s*ಪರಿವರ್ತನೆ[:\s,.]*/gi,

            // Malayalam prefixes (Enhanced)
            /^(ശരി,?\s*)?ഇവിടെ\s*(നേരിട്ട്\s*)?പ്രസംഗം\s*(പരിവർത്തനം|വാചകം|പ്രതികരണം)[:\s,.]*/gi,
            /^(നല്ലത്,?\s*)?ഇത്\s*(നേരിട്ട്\s*)?പ്രസംഗം\s*(പരിവർത്തനം|വാചകം)[:\s,.]*/gi,
            /^മലയാളത്തിൽ\s*വിവർത്തനം[:\s,.]*/gi,
            /^നൽകിയ\s*പ്രസ്താവന[:\s,.]*/gi,
            /^ഇംഗ്ലീഷ്\s*പരിവർത്തനം[:\s,.]*/gi,

            // Punjabi prefixes (Enhanced)
            /^(ਠੀਕ ਹੈ,?\s*)?ਇੱਥੇ\s*(ਸਿੱਧਾ\s*)?ਭਾਸ਼ਣ\s*(ਬਦਲਾਅ|ਟੈਕਸਟ|ਜਵਾਬ)[:\s,.]*/gi,
            /^(ਚੰਗਾ,?\s*)?ਇਹ\s*(ਸਿੱਧਾ\s*)?ਭਾਸ਼ਣ\s*(ਬਦਲਾਅ|ਟੈਕਸਟ)[:\s,.]*/gi,
            /^ਪੰਜਾਬੀ\s*ਵਿੱਚ\s*ਅਨੁਵਾਦ[:\s,.]*/gi,
            /^ਦਿੱਤਾ\s*ਗਿਆ\s*ਬਿਆਨ[:\s,.]*/gi,
            /^ਅੰਗਰੇਜ਼ੀ\s*ਬਦਲਾਅ[:\s,.]*/gi,

            // Odia prefixes (Enhanced)
            /^(ଠିକ୍ ଅଛି,?\s*)?ଏଠାରେ\s*(ସିଧା\s*)?ଭାଷଣ\s*(ପରିବର୍ତ୍ତନ|ପାଠ୍ୟ|ପ୍ରତିକ୍ରିୟା)[:\s,.]*/gi,
            /^(ଭଲ,?\s*)?ଏହା\s*(ସିଧା\s*)?ଭାଷଣ\s*(ପରିବର୍ତ୍ତନ|ପାଠ୍ୟ)[:\s,.]*/gi,
            /^ଓଡ଼ିଆରେ\s*ଅନୁବାଦ[:\s,.]*/gi,
            /^ପ୍ରଦାନ\s*କରାଯାଇଥିବା\s*ବିବୃତି[:\s,.]*/gi,
            /^ଇଂରାଜୀ\s*ପରିବର୍ତ୍ତନ[:\s,.]*/gi,

            // Assamese prefixes (Enhanced)
            /^(ঠিক আছে,?\s*)?ইয়াত\s*(পোনপটীয়া\s*)?ভাষণ\s*(ৰূপান্তৰ|পাঠ|প্ৰতিক্ৰিয়া)[:\s,.]*/gi,
            /^(ভাল,?\s*)?এয়া\s*(পোনপটীয়া\s*)?ভাষণ\s*(ৰূপান্তৰ|পাঠ)[:\s,.]*/gi,
            /^অসমীয়াত\s*অনুবাদ[:\s,.]*/gi,
            /^প্ৰদান\s*কৰা\s*বিবৃতি[:\s,.]*/gi,
            /^ইংৰাজী\s*ৰূপান্তৰ[:\s,.]*/gi,

            // Urdu prefixes (Enhanced)
            /^(ٹھیک ہے,?\s*)?یہاں\s*(براہ راست\s*)?تقریر\s*(تبدیلی|متن|جواب)[:\s,.]*/gi,
            /^(اچھا,?\s*)?یہ\s*(براہ راست\s*)?تقریر\s*(تبدیلی|متن)[:\s,.]*/gi,
            /^اردو\s*میں\s*ترجمہ[:\s,.]*/gi,
            /^فراہم\s*کردہ\s*بیان[:\s,.]*/gi,
            /^انگریزی\s*تبدیلی[:\s,.]*/gi,

            // Generic conversational fillers (All languages)
            /^(sure|okay|alright|right)[,.\s]*/gi,
            /^(ज़रूर|ठीक|अच्छा|सही)[,.\s]*/gi,
            /^(নিশ্চয়|ঠিক|ভাল|সঠিক)[,.\s]*/gi,
            /^(ఖచ్చితంగా|సరే|మంచిది|సరైన)[,.\s]*/gi,
            /^(नक्कीच|ठीक|चांगले|बरोबर)[,.\s]*/gi,
            /^(நிச்சயமாக|சரி|நல்லது|சரியான)[,.\s]*/gi,
            /^(ચોક્કસ|ઠીક|સારું|યોગ્ય)[,.\s]*/gi,
            /^(ಖಂಡಿತ|ಸರಿ|ಒಳ್ಳೆಯದು|ಸರಿಯಾದ)[,.\s]*/gi,
            /^(തീർച്ചയായും|ശരി|നല്ലത്|ശരിയായ)[,.\s]*/gi,
            /^(ਯਕੀਨੀ|ਠੀਕ|ਚੰਗਾ|ਸਹੀ)[,.\s]*/gi,
            /^(ନିଶ୍ଚିତ|ଠିକ୍|ଭଲ|ସଠିକ୍)[,.\s]*/gi,
            /^(নিশ্চিত|ঠিক|ভাল|সঠিক)[,.\s]*/gi,
            /^(یقینی|ٹھیک|اچھا|صحیح)[,.\s]*/gi
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
            .replace(/^(நிச்சயமாக|சரி|நல்لது|சரியான)[,.\s]*/gi, '')
            .replace(/^(ચોક્કસ|ઠીક|સારું|યોગ્ય)[,.\s]*/gi, '')
            .replace(/^(ಖಂಡಿತ|ಸರಿ|ಒಳ್ಳೆಯದು|ಸರಿಯಾದ)[,.\s]*/gi, '')
            .replace(/^(തീർച്ചയായും|ശരി|നല്ലത്|ശരിയായ)[,.\s]*/gi, '')
            .replace(/^(ਯਕੀਨੀ|ਠੀਕ|ਚੰਗਾ|ਸਹੀ)[,.\s]*/gi, '')
            .replace(/^(ନିଶ୍ଚିତ|ଠିକ୍|ଭଲ|ସଠିକ୍)[,.\s]*/gi, '')
            .replace(/^(নিশ্চিত|ঠিক|ভাল|ସଠିକ୍)[,.\s]*/gi, '')
            .replace(/^(یقینی|ٹھیک|اچھا|صحیح)[,.\s]*/gi, '')

            // Remove meta-commentary about conversation/translation
            .replace(/^(direct\s*speech\s*in\s*\w+)[:\s,.]*/gi, '')
            .replace(/^(प्रत्यक्ष\s*भाषण)[:\s,.]*/gi, '')
            .replace(/^(সরাসরি\s*বক্তৃতা)[:\s,.]*/gi, '')
            .replace(/^(ప్రత్యక్ష\s*ప్రసంగం)[:\s,.]*/gi, '')
            .replace(/^(थेट\s*भाषण)[:\s,.]*/gi, '')
            .replace(/^(நேரடி\s*பேச்சு)[:\s,.]*/gi, '')
            .replace(/^(સીધું\s*ભાષણ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(ನೇರ\s*ಭಾಷಣ)[:\s,.]*/gi, '')
            .replace(/^(നേരിട്ടുള്ള\s*പ്രസംഗം)[:\s,.]*/gi, '')
            .replace(/^(ਸਿੱਧਾ\s*ਭਾਸ਼ਣ)[:\s,.]*/gi, '')
            .replace(/^(ସିଧା\s*ଭାଷଣ)[:\s,.]*/gi, '')
            .replace(/^(পোনপটীয়া\s*ভাষণ)[:\s,.]*/gi, '')
            .replace(/^(براہ\s*راست\s*تقریر)[:\s,.]*/gi, '')

            // Remove any remaining colons or markers at the start
            .replace(/^[:\-\s]*/, '')
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
