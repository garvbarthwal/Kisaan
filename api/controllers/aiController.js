const { GoogleGenerativeAI } = require("@google/generative-ai"); // Corrected import for @google-generative-ai
const Product = require("../models/ProductModel");

// Helper function to detect if query is an instruction vs question
const isInstruction = (query) => {
    const lowerQuery = query.toLowerCase();

    const instructionIndicators = [
        // English imperatives
        'add', 'increase', 'decrease', 'reduce', 'set', 'update', 'remove', 'take out', 'put in', 'sell', 'harvest', 'use', 'consume', 'lose', 'damage', 'spoil', 'buy', 'grow', 'sow', 'plant', 'collect', 'receive',

        // Hindi imperatives
        'बढ़ा दो', 'घटा दो', 'कम कर दो', 'ज्यादा कर दो', 'जोड़ दो', 'निकाल दो', 'सेट कर दो',
        'बढ़ाओ', 'घटाओ', 'कम करो', 'ज्यादा करो', 'जोड़ो', 'निकालो', 'सेट करो', 'अपडेट करो',
        'हटाओ', 'हटा दो', 'डालो', 'डाल दो', 'बेचो', 'बेच दो', 'काटो', 'काट दो', 'इस्तेमाल करो', 'उपयोग करो', 'खरीदो', 'बोओ', 'lagaao', 'इकट्ठा करो', 'प्राप्त करो', 'मिला', 'mil gaya', 'खत्म हो गया', 'नष्ट हो गया',

        // Hinglish imperatives (common variations)
        'add karo', 'add kar do', 'nikal do', 'ghatao', 'ghata do', 'badhao', 'badha do', 'bech diya', 'use kiya', 'set karo', 'set kar do', 'update karo', 'kam karo', 'kam kar do', 'jyada karo', 'jyada kar do', 'dal do', 'kharab ho gaya', 'fek diya', 'kat gaya', 'kat liya', 'kharida', 'ugao', 'boya', 'lagao', 'mila', 'mil gaya', 'aya hai', 'aaye hain', 'becha', 'khatam ho gaya', 'khaya', 'bigad gaya', 'nuksan hua', 'gaya', 'jal gaya', 'sad gaya', 'tut gaya', 'kam ho gaya', 'zyada ho gaya', 'ho gaya', 'kar do', 'daal do', 'nikal do', 'uthaya', 'utha liya', 'rakh do', 'rakh diya', 'badao', 'ghatao',

        // Bengali imperatives
        'বাড়াও', 'বাড়িয়ে দাও', 'কমাও', 'কমিয়ে দাও', 'জোড় করো', 'সরাও', 'সরিয়ে দাও',
        'সেট করো', 'সেট কর', 'আপডেট করো', 'আপডেট কর', 'তুলে নাও', 'ফেলে দাও', 'বিক্রি করো', 'ব্যবহার করো', 'কেনো', 'বুনো', 'লাগাও', 'সংগ্রহ করো', 'পাও', 'পেয়েছি', 'শেষ হয়ে গেছে', 'নষ্ট হয়ে গেছে',

        // Telugu imperatives
        'పెంచండి', 'పెంచు', 'తగ్గించండి', 'తగ్గించు', 'జోడించండి', 'జోడించు', 'తీసేయండి', 'తీసేయ్',
        'సెట్ చేయండి', 'సెట్ చేయ్', 'అప్‌డేట్ చేయండి', 'మార్చండి', 'మార్చు', 'అమ్మండి', 'అమ్ము', 'వాడండి', 'వాడు', 'కొనండి', 'కొను', 'నాటండి', 'నాటు', 'సేకరించండి', 'సేకరించు', 'పొందండి', 'పొందు', 'అయిపోయింది', 'పాడైపోయింది',

        // Marathi imperatives
        'वाढवा', 'वाढव', 'घटवा', 'घटव', 'जोडा', 'जोड', 'काढा', 'काढ', 'सेट करा', 'सेट कर',
        'अपडेट करा', 'अपडेट कर', 'बदला', 'बदल', 'विका', 'विक', 'वापरा', 'वापर', 'खरेदी करा', 'खरेदी कर', 'पेरा', 'लाव', 'गोळा करा', 'गोळा कर', 'मिळवा', 'मिळव', 'संपले', 'खराब झाले',

        // Tamil imperatives
        'கூட்டு', 'கூட்டவும்', 'குறை', 'குறைக்கவும்', 'சேர்', 'சேர்க்கவும்', 'நீக்கு', 'நீக்கவும்',
        'அமை', 'அமைக்கவும்', 'புதுப்பி', 'புதுப்பிக்கவும்', 'விற்கவும்', 'விற்க', 'பயன்படுத்து', 'பயன்படுத்தவும்', 'வாங்கவும்', 'வாங்க', 'நடவு செய்', 'நடவு செய்யவும்', 'சேகரி', 'சேகரிக்கவும்', 'பெறு', 'பெறவும்', 'முடிந்தது', 'சேதமடைந்தது',

        // Gujarati imperatives
        'વધારો', 'વધાર', 'ઘટાડો', 'ઘટાડ', 'જોડો', 'જોડ', 'સેટ કરો', 'सेटका',
        'અપડેટ કરો', 'અપડેટ કર', 'વેચો', 'વેચ', 'વાપરો', 'વાપર', 'ખરીદો', 'ખરીદ', 'વાવો', 'વાવ', 'એકત્ર કરો', 'એકત્ર કર', 'મેળવો', 'મેળવ', 'પૂરું થયું', 'નુકસાન થયું',

        // Kannada imperatives
        'ಹೆಚ್ಚಿಸು', 'ಹೆಚ್ಚಿಸಿ', 'ಕಡಿಮೆಮಾಡು', 'ಕಡಿಮೆಮಾಡಿ', 'ಸೇರಿಸು', 'ಸೇರಿಸಿ', 'ತೆಗೆದುಹಾಕು', 'ತೆಗೆದುಹಾಕಿ',
        'ಹೊಂದಿಸು', 'ಹೊಂದಿಸಿ', 'ನವೀಕರಿಸು', 'ನವೀಕರಿಸಿ', 'ಮಾರಾಟ ಮಾಡು', 'ಮಾರಾಟ ಮಾಡಿ', 'ಬಳಸು', 'ಬಳಸಿ', 'ಖರೀದಿಸು', 'ಖರೀದಿಸಿ', 'ಬೀಜ ಬಿತ್ತು', 'ಬೀಜ ಬಿತ್ತಿ', 'ನೆಡು', 'ನೆಡಿ', 'ಸಂಗ್ರಹಿಸು', 'ಸಂಗ್ರಹಿಸಿ', 'ಪಡೆಯಿರಿ', 'ಪಡೆ', 'ಮುಗಿದಿದೆ', 'ಹಾಳಾಗಿದೆ',

        // Malayalam imperatives
        'കൂട്ടുക', 'കൂട്ടൂ', 'കുറയ്ക്കുക', 'കുറയ്ക്കൂ', 'ചേർക്കുക', 'ചേർക്കൂ', 'നീക്കം ചെയ്യുക', 'നീക്കം ചെയ്യൂ',
        'സജ്ജമാക്കുക', 'സജ്ജമാക്കൂ', 'അപ്ഡേറ്റ് ചെയ്യുക', 'അപ്ഡേറ്റ് ചെയ്യൂ', 'വിൽക്കുക', 'വിൽക്കൂ', 'ഉപയോഗിക്കുക', 'ഉപയോഗിക്കൂ', 'വാങ്ങുക', 'വാങ്ങൂ', 'നടുക', 'നടൂ', 'ശേഖരിക്കുക', 'ശേഖരിക്കൂ', 'ലഭിക്കുക', 'ലഭിക്കൂ', 'തീർന്നു', 'കേടുവന്നു',

        // Punjabi imperatives
        'ਵਧਾਓ', 'ਵਧਾ', 'ਘਟਾਓ', 'ਘਟਾ', 'ਜੋੜੋ', 'ਜੋੜ', 'ਸੈੱਟ ਕਰੋ', 'ਸੈੱਟ ਕਰ',
        'ਅੱਪਡੇਟ ਕਰੋ', 'ਅੱਪਡੇਟ ਕਰ', 'ਵੇਚੋ', 'ਵੇਚ', 'ਵਰਤੋ', 'ਵਰਤ', 'ਖਰੀਦੋ', 'ਖਰੀਦ', 'ਬੀਜੋ', 'ਬੀਜ', 'ਲਾਓ', 'ਲਾ', 'ਇਕੱਠੇ ਕਰੋ', 'ਇਕੱਠੇ ਕਰ', 'ਪ੍ਰਾਪਤ ਕਰੋ', 'ਪ੍ਰਾਪਤ ਕਰ', 'ਖਤਮ ਹੋ ਗਿਆ', 'ਖਰਾਬ ਹੋ ਗਿਆ',

        // Odia imperatives
        'ବଢାନ୍ତୁ', 'ବଢା', 'କମାନ୍ତୁ', 'କମା', 'ଯୋଡନ୍ତୁ', 'ଯୋଡ', 'ସେଟ୍ କରନ୍ତୁ', 'ସେଟ୍ କର',
        'ଅପଡେଟ୍ କରନ୍ତୁ', 'ଅପଡେଟ୍ କର', 'ବିକ୍ରି କରନ୍ତୁ', 'ବିକ୍ରି କର', 'ବ୍ୟବହାର କରନ୍ତୁ', 'ବ୍ୟବହାର କର', 'କିଣନ୍ତୁ', 'କିଣ', 'ବୁଣନ୍ତୁ', 'ବୁଣ', 'ଲଗାନ୍ତୁ', 'ଲଗା', 'ସଂଗ୍ରହ କରନ୍ତୁ', 'ସଂଗ୍ରହ କର', 'ପାଆନ୍ତୁ', 'ପାଅ', 'ଶେଷ ହୋଇଗଲା', 'ନଷ୍ଟ ହୋଇଗଲା',

        // Assamese imperatives
        'বঢ়াওক', 'বঢ়া', 'কমাওক', 'কমা', 'যোগ কৰক', 'যোগ কৰ', 'ছেট কৰক', 'ছেট কৰ',
        'আপডেট কৰক', 'আপডেট কৰ', 'বিক্ৰী কৰক', 'বিক্ৰী কৰ', 'ব্যৱহাৰ কৰক', 'ব্যৱহাৰ কৰ', 'কিনিব', 'কিন', 'সিঁচক', 'সিঁচ', 'লগাওক', 'লগা', 'সংগ্ৰহ কৰক', 'সংগ্ৰহ কৰ', 'পাওক', 'পা', 'শেষ হ’ল', 'নষ্ট হ’ল',

        // Urdu imperatives
        'بڑھاؤ', 'بڑھا', 'کم کرو', 'کم کر', 'جوڑو', 'جوڑ', 'سیٹ کرو', 'سیٹ کر',
        'اپ ڈیٹ کرو', 'اپ ڈیٹ کر', 'بیچو', 'بیچ', 'استعمال کرو', 'استعمال کر', 'خریدو', 'خرید', 'بوؤ', 'بو', 'لگاؤ', 'لگا', 'جمع کرو', 'جمع کر', 'حاصل کرو', 'حاصل کر', 'ختم ہو گیا', 'خراب ہو گیا'
    ];

    // Check for instruction words first
    const hasInstructionWords = instructionIndicators.some(indicator =>
        lowerQuery.includes(indicator.toLowerCase())
    );

    if (hasInstructionWords) {
        return true; // If it has instruction words, it's an instruction.
    }

    // Question indicators - only check if no instruction words are found
    const questionIndicators = [
        // English
        'how much', 'how many', 'what is', 'what are', 'do i have', 'show me', 'tell me', 'check my', 'what\'s my', 'how much stock', 'how many items', 'current stock', 'total stock', 'inventory of', 'remaining', 'left', 'any', 'any products', 'any wheat', 'any rice',

        // Hindi
        'कितना', 'कितनी', 'कितने', 'क्या है', 'मेरे पास', 'dikhhao', 'बताओ', 'कहाँ है', 'कितना स्टॉक', 'कितनी मात्रा', 'मौजूदा स्टॉक', 'कुल स्टॉक', 'किसका स्टॉक', 'बचा हुआ', 'कोई', 'कोई उत्पाद', 'कोई गेहूं', 'कोई चावल',

        // Hinglish question indicators
        'kitna hai', 'kitni hai', 'kitne hain', 'mere paas kitna', 'show me my stock', 'kya hai mere paas', 'stock kitna hai', 'kitne bache hain', 'kya stock hai', 'available hai kya', 'kitne items hain', 'total kitna hai', 'konsa stock hai', 'mera inventory', 'mera stock', 'check karo', 'dekho',

        // Bengali
        'কত', 'কতটুকু', 'কি আছে', 'দেখাও', 'বলো', 'কোথায়', 'কত স্টক', 'কত পরিমাণ', 'বর্তমান স্টক', 'মোট স্টক', 'আমার কাছে', 'কি আমার আছে', 'উপলব্ধ', 'বাকি', 'কোন', 'কোন পণ্য', 'কোন গম', 'কোন চাল',

        // Telugu
        'ఎంత', 'ఎన్ని', 'ఏమిటి', 'చూపించు', 'చెప్పు', 'ఎక్కడ', 'ఎంత స్టాక్', 'ఎంత పరిమాణం', 'ప్రస్తుత స్టాక్', 'మొత్తం స్టాక్', 'నా దగ్గర', 'నాకు', 'అందుబాటులో', 'మిగిలిన', 'ఏదైనా', 'ఏదైనా ఉత్పత్తులు', 'ఏదైనా గోధుమలు', 'ఏదైనా వరి',

        // Marathi
        'किती', 'काय आहे', 'दाखवा', 'सांगा', 'कुठे आहे', 'किती साठा', 'किती प्रमाण', 'सध्याचा साठा', 'एकूण साठा', 'माझ्याकडे', 'माझा', 'उपलब्ध', 'उरलेला', 'काही', 'काही उत्पादने', 'काही गहू', 'काही तांदूळ',

        // Tamil
        'எவ்வளவு', 'எத்தனை', 'என்ன', 'காட்டு', 'சொல்', 'எங்கே', 'எவ்வளவு ஸ்டாக்', 'எவ்வளவு அளவு', 'தற்போதைய ஸ்டாக்', 'மொத்த ஸ்டாக்', 'என்னிடம்', 'என்', 'கிடைக்கும்', 'மீதமுள்ள', 'ஏதேனும்', 'ஏதேனும் பொருட்கள்', 'ஏதேனும் கோதுமை', 'ஏதேனும் அரிசி',

        // Gujarati
        'કેટલું', 'કેટલા', 'શું છે', 'બતાવો', 'કહો', 'ક્યાં છે', 'કેટલો સ્ટોક', 'કેટલી માત્રા', 'વર્તમાન સ્ટોક', 'કુલ સ્ટોક', 'મારી પાસે', 'મારું', 'કોઈ ઘઉં', 'કોઈ ચોખા',

        // Kannada
        'ಎಷ್ಟು', 'ಏನು', 'ತೋರಿಸು', 'ಹೇಳು', 'ಎಲ್ಲಿ', 'ಎಷ್ಟು ಸ್ಟಾಕ್', 'ಎಷ್ಟು ಪ್ರಮಾಣ', 'ಪ್ರಸ್ತುತ ಸ್ಟಾಕ್', 'ಒಟ್ಟು ಸ್ಟಾಕ್', 'ನನ್ನ ಬಳಿ', 'ನನ್ನ', 'ಲಭ್ಯವಿದೆ', 'ಉಳಿದಿದೆ', 'ಯಾವುದಾದರೂ', 'ಯಾವುದಾದರೂ ಉತ್ಪನ್ನಗಳು', 'ಯಾವುದಾದರೂ ಗೋಧಿ', 'ಯಾವುದಾದರೂ ಅಕ್ಕಿ',

        // Malayalam
        'എത്ര', 'എന്ത്', 'കാണിക്കൂ', 'പറയൂ', 'എവിടെ', 'എത്ര സ്റ്റോക്ക്', 'എത്ര അളവ്', 'നിലവിലെ സ്റ്റോക്ക്', 'മൊത്തം സ്റ്റോക്ക്', 'എന്റെ കയ്യിൽ', 'എന്റെ', 'ലഭ്യമാണ്', 'ബാക്കിയുണ്ട്', 'എന്തെങ്കിലും', 'എന്തെങ്കിലും ഉൽപ്പന്നങ്ങൾ', 'എന്തെങ്കിലും ഗോതമ്പ്', 'എന്തെങ്കിലും അരി',

        // Punjabi
        'ਕਿੰਨਾ', 'ਕਿੰਨੇ', 'ਕੀ ਹੈ', 'ਦਿਖਾਓ', 'ਦੱਸੋ', 'ਕਿੱਥੇ ਹੈ', 'ਕਿੰਨਾ ਸਟਾਕ', 'ਕਿੰਨੀ ਮਾਤਰਾ', 'ਮੌਜੂਦਾ ਸਟਾਕ', 'ਕੁੱਲ ਸਟਾਕ', 'ਮੇਰੇ ਕੋਲ', 'ਮੇਰਾ', 'ਉਪਲਬਧ', 'ਬਾਕੀ', 'ਕੋਈ', 'ਕੋਈ ਉਤਪਾਦ', 'ਕੋਈ ਕਣਕ', 'ਕੋਈ ਚਾਵਲ',

        // Odia
        'ଷ୍ଟକ୍', 'ଭଣ୍ଡାର', 'ପରିମାଣ', 'ଉପଲବ୍ଧ', 'ବାକି', 'କେତେ',
        'ମୋର ପାଖରେ', 'ମୋର', 'କୌଣସି ଗହମ', 'କୌଣସି ଚାଉଳ', 'ଦେଖାଅ',
        'ମୋଟ ଷ୍ଟକ୍', 'ବର୍ତ୍ତମାନ ଷ୍ଟକ୍',

        // Assamese
        'ষ্টक', 'ଭাণ্ডাৰ', 'ପରିମାଣ', 'উপলବ୍ଧ', 'বাকী', 'কিমান',
        'মোৰ ଓଚৰত', 'মোৰ', 'কোনো ঘেঁਹੁ', 'কোনো চাউল', 'দেখুৱাওক',
        'মুঠ ষ্টक', 'বৰ্তମାନ ষ্টक',

        // Urdu
        'کتنا', 'کتنے', 'کیا ہے', 'دکھاؤ', 'بتاؤ', 'کہاں ہے', 'کتنا اسٹاک', 'کتنی مقدار', 'موجودہ اسٹاک', 'کل اسٹاک', 'میرے پاس', 'میرا', 'دستیاب', 'باقی', 'کوئی', 'کوئی مصنوعات', 'کوئی گندم', 'کوئی چاول'
    ];

    const hasQuestionWords = questionIndicators.some(indicator =>
        lowerQuery.includes(indicator.toLowerCase())
    );

    // If no instruction words were found, then check if it's a question.
    // If it has question words, it's NOT an instruction.
    // If it has NEITHER, it's also NOT an instruction (default to general query).
    return !hasQuestionWords;
};

// Helper function to detect inventory update queries in multiple languages
const isInventoryUpdateQuery = (query) => {
    const updateKeywords = [
        // English (expanded with more patterns)
        'update', 'modify', 'change', 'adjust', 'edit', 'increase', 'decrease', 'reduce', 'add to', 'add in',
        'add', 'remove', 'subtract', 'set', 'make', 'take out', 'sold', 'harvest', 'picked', 'put in',
        'collected', 'used', 'consumed', 'wasted', 'damaged', 'spoiled', 'expired', 'from stock', 'to stock',
        'delivered', 'shipped', 'supplied', 'dumped', 'lost', 'burnt', 'rotten', 'destroyed', 'में से', 'में',
        'buy', 'bought', 'receive', 'received', 'grow', 'grew', 'sow', 'sowed', 'plant', 'planted', 'replenish', 'replenished',

        // Hinglish & spoken forms (expanded)
        'bech diya', 'becha', 'bech do', 'add karo', 'add kar do', 'nikal diya', 'nikal do', 'ghatao', 'ghata do', 'badhao', 'badha do',
        'kat gaya', 'kat liya', 'kat chuka', 'use kiya', 'use kar do', 'khatam ho gaya', 'kha gaya', 'kam karo', 'kam kar do',
        'fek diya', 'saara gaya', 'dal diya', 'dal do', 'bacha nahi', 'kharab ho gaya', 'pura bech diya', 'jyada karo', 'jyada kar do',
        'mila', 'mil gaya', 'wapas mila', 'de diya', 'utha liya', 'khaali ho gaya', 'set karo', 'set kar do', 'update karo',
        'kharida', 'kharid liya', 'ugaya', 'ugao', 'boya', 'lagaya', 'laga do', 'paaya', 'pa liya', 'received hua', 'badao', 'ghatao',

        // ✅ Hindi (expanded native script with imperative forms)
        'अपडेट', 'बदलना', 'बदलाव', 'घटाना', 'घटाओ', 'घटा दो', 'कम करना', 'कम करो', 'कम कर दो', 'कम',
        'बढ़ाना', 'बढ़ाओ', 'बढ़ा दो', 'ज्यादा करना', 'ज्यादा करो', 'ज्यादा कर दो', 'अधिक करो', 'अधिक कर दो',
        'सेटका', 'सेट करो', 'सेट कर दो', 'हटाना', 'हटाओ', 'हटा दो', 'निकालना', 'निकालो', 'निकाल दिया', 'निकाल दो',
        'बेचना', 'बेच दिया', 'बेचो', 'बेच दो', 'काटना', 'काट दिया', 'काटो', 'काट दो', 'तोड़ा', 'तोड़ो', 'तोड़ दो',
        'इस्तेमाल करना', 'इस्तेमाल किया', 'इस्तेमाल करो', 'उपयोग करो', 'खराब', 'सड़ा', 'जोड़ो', 'जोड़ दो',
        'समाप्त', 'ख़त्म', 'खत्म हो गया', 'दिया', 'भेजा', 'नष्ट', 'फेंका', 'फेंk दिया', 'डालो', 'डाल दो',
        'खरीदा', 'खरीदना', 'उगाया', 'उगाना', 'बोया', 'बोना', 'lagaaya', 'लगाना', 'प्राप्त किया', 'प्राप्त करना', 'भरना', 'भर दो',

        // Bengali (expanded with imperatives)
        'কমাও', 'কমিয়ে দাও', 'বাড়াও', 'বাড়িয়ে দাও', 'সরাও', 'সরিয়ে দাও', 'উঠাও', 'উঠিয়ে নাও',
        'বিক্রি করো', 'বিক্রি কর', 'ব্যবহার করো', 'ব্যবহার কর', 'ফেলে দাও', 'ফেল', 'নষ্ট হয়ে গেছে',
        'শেষ হয়ে গেছে', 'দিয়ে দাও', 'দাও', 'নষ্ট', 'শেষ', 'কাট', 'কেটে দাও', 'তোল', 'তুলে নাও', 'খারাপ',
        'যোগ করো', 'যোগ কর', 'বিয়োগ করো', 'বিয়োগ কর', 'সেট করো', 'সেট কর', 'কেনা', 'কিনেছি', 'রোপণ করো', 'রোপণ কর', 'সংগ্রহ করা', 'পেয়েছি',

        // Telugu (expanded with imperatives)
        'తగ్గించండి', 'తగ్గించు', 'తగ్గించేయ్', 'పెంచండి', 'పెంచు', 'పెంచేయ్', 'తీసెయ్యండి', 'తీసేయ్', 'తీయండి',
        'అమ్మండి', 'అమ్ము', 'అమ్మేయ్', 'వాడండి', 'వాడు', 'వాడేయ్', 'కత్తిరించండి', 'కత్తిరించు', 'పంపండి', 'పంపు',
        'చెడ్డది', 'ఖతం', 'వెళ్లిపోయింది', 'తగ్గు', 'పెంచు', 'తీసు', 'వాడు', 'జోడించు', 'జోడించండి',
        'సెట్ చేయండి', 'సెట్ చేయ్', 'అప్‌డేట్ చేయండి', 'మార్చండి', 'మార్చు', 'కొనండి', 'కొను', 'పెంచండి', 'పెంచు', 'నాటండి', 'నాటు', 'సేకరించండి', 'సేకరించు', 'పొందండి', 'పొందు',

        // Marathi (expanded with imperatives)
        'घटवा', 'घटव', 'कमी करा', 'कमी कर', 'वाढवा', 'वाढव', 'जास्त करा', 'जास्त कर', 'काढा', 'काढ',
        'विकली', 'विका', 'विक', 'कापली', 'कापा', 'काप', 'वापरली', 'वापरा', 'वापर', 'खराब', 'संपली', 'संपवा',
        'फेकली', 'फेका', 'फेक', 'गेली', 'नष्ट', 'दिली', 'दे', 'द्या', 'पाठवली', 'पाठवा', 'पाठव',
        'उपयोग केला', 'उपयोग करा', 'उपयोग कर', 'जोडा', 'जोड', 'सेट करा', 'सेट कर', 'खरेदी केली', 'खरेदी कर', 'वाढवा', 'वाढव', 'पेरली', 'पेर', 'लावली', 'लाव', 'मिळाली', 'मिळव',

        // Tamil
        'குறைச்சு', 'அதிகச்சு', 'வாங்கினேன்', 'விற்றேன்', 'கழித்தேன்', 'அறுத்தேன்', 'பயன்படுத்தினேன்',
        'அனுப்பினேன்', 'கெட்டது', 'முடிந்தது', 'போகட்டும்', 'நஷ்டம்', 'அழித்தேன்', 'வாங்கினேன்', 'வளர்த்தேன்', 'விதைத்தேன்', 'நட்டேன்', 'பெற்றேன்', 'சேகரித்தேன்',

        // Gujarati
        'ઘટાડો', 'વધારો', 'કાઢો', 'વેચી નાખ્યું', 'વાપર્યું', 'કાપ્યું', 'ખરાબ', 'ફેંકી દીધું', 'નાશ',
        'મોકલી', 'સમાપ્ત', 'નષ્ટ', 'દઈ દીધું', 'હટાવ્યું', 'ખરીદ્યું', 'ઉગાડ્યું', 'વાવ્યું', 'રોપ્યું', 'મેળવ્યું', 'એકત્ર કર્યું',

        // Kannada
        'ಕಡಿಮೆಮಾಡು', 'ಹೆಚ್ಚಿಸು', 'ತೆಗೆದುಹಾಕು', 'ಮಾರಿದೆ', 'ಬಳಸಿದೆ', 'ಕತ್ತರಿಸಿದೆ', 'ಹಾಳಾಗಿದೆ',
        'ಕೊಟ್ಟಿದ್ದೇನೆ', 'ಕಳುಹಿಸಿದ್ದೇನೆ', 'ನಷ್ಟವಾಗಿದೆ', 'ತೊಡಗಿಸಲಾಗಿದೆ', 'ಮುಕ್ತವಾಗಿದೆ', 'ಖರೀದಿಸಿದೆ', 'ಬೆಳೆಸಿದೆ', 'ಬಿತ್ತಿದೆ', 'ನೆಟ್ಟಿದೆ', 'ಸ್ವೀಕರಿಸಿದೆ', 'ಸಂಗ್ರಹಿಸಿದೆ',

        // Malayalam
        'കുറയ്ക്കുക', 'കൂട്ടുക', 'എടുത്തു', 'വാങ്ങിയതും', 'ഉപയോഗിച്ചു', 'വില്പന', 'വിറ്റു',
        'കഴിഞ്‌ഞു', 'മറക്കുക', 'അവസാനിച്ചു', 'പോകട്ടെ', 'നഷ്ടപ്പെട്ടു', 'കൊടുത്തു', 'കണ്ടില്ല', 'വാങ്ങി', 'വളർത്തി', 'വിത്തിട്ടു', 'നട്ടു', 'ലഭിച്ചു', 'ശേഖരിച്ചു',

        // Punjabi
        'ਘਟਾਓ', 'ਵਧਾਓ', 'ਕੱਢੋ', 'ਵਿੱਚਿਆ', 'ਕੱਟਿਆ', 'ਵਰਤਿਆ', 'ਦਿੱਤਾ', 'ਖਤਮ ਹੋ ਗਿਆ',
        'ਭੇਜਿਆ', 'ਨਿਕਲ ਗਿਆ', 'ਖਰਾਬ', 'ਮਾਰਿਆ', 'ਸਾਫ਼ ਕੀਤਾ', 'ਹਟਾਇਆ', 'ਖਰੀਦਿਆ', 'ਉਗਾਇਆ', 'ਬੀਜਿਆ', 'ਲਗਾਇਆ', 'ਪ੍ਰਾਪਤ ਕੀਤਾ', 'ਇਕੱਠਾ ਕੀਤਾ',

        // Odia
        'କମାନ୍ତୁ', 'ଅଧିକ କରନ୍ତୁ', 'କାଢ଼ନ୍ତୁ', 'ବିକ୍ରି', 'ବ୍ୟବହାର', 'ଖରାପ', 'ଦେଲି', 'ପଠାଇଲି',
        'ନଷ୍ଟ', 'ଅପଚୟ', 'ଖତମ', 'ଫେଙ୍କିଦିଅ', 'ସମାପ୍ତ', 'କିଣିଲି', 'ବଢାଇଲି', 'ବୁଣିଲି', 'ରୋପଣ କଲି', 'ପାଇଲି', 'ସଂଗ୍ରହ କଲି',

        // Assamese
        'বঢ়াওক', 'বঢ়া', 'কমাওক', 'কমা', 'যোগ কৰক', 'যোগ কৰ', 'ছেট কৰক', 'ছেট কৰ',
        'আপডেট কৰক', 'আপডেট কৰ', 'বিক্ৰী কৰক', 'বিক্ৰী কৰ', 'ব্যৱহাৰ কৰক', 'ব্যৱহাৰ কৰ', 'কিনিব', 'কিন', 'সিঁচক', 'সিঁচ', 'লগাওক', 'লগা', 'সংগ্ৰহ কৰক', 'সংগ্ৰহ কৰ', 'পাওক', 'পা', 'শেষ হ’ল', 'নষ্ট হ’ল',

        // Urdu
        'کم کرو', 'زیادہ کرو', 'نکالو', 'بیچو', 'استعمال کرو', 'استعمال کر', 'خریدو', 'خرید', 'بوؤ', 'بو', 'لگاؤ', 'لگا', 'جمع کرو', 'جمع کر', 'حاصل کرو', 'حاصل کر', 'ختم ہو گیا', 'خراب ہو گیا'
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
        'current stock', 'total stock', 'कितना है', 'कितनी है', 'कितने हैं', 'कितना स्टॉक', 'कितनी मात्रा',

        // Hindi
        'स्टॉक', 'भंडार', 'मात्रा', 'उपलब्ध', 'बचा', 'शेष', 'कितना', 'कितनी', 'कितने',
        'मेरे पास', 'मेरा', 'क्या मेरे पास', 'दिखाओ', 'देखो', 'कोई गेहूं', 'कोई चावल',
        'कुल स्टॉक', 'मौजूदा स्टॉक',

        // Hinglish stock indicators
        'stock kitna hai', 'inventory kitna', 'kitna bacha hai', 'mere paas kitna hai', 'show me my stock', 'kya hai mere paas', 'stock kitna hai', 'kitne bache hain', 'kya stock hai', 'available hai kya', 'kitne items hain', 'total kitna hai', 'konsa stock hai', 'mera inventory', 'mera stock', 'check karo', 'dekho',

        // Bengali
        'স্টক', 'মজুদ', 'পরিমাণ', 'উপলব্ধ', 'বাকি', 'অবশিষ্ট', 'কতটুকু', 'কত',
        'আমার কাছে', 'আমার', 'কি আমার আছে', 'দেখাও', 'কোন গম', 'কোন চাল',
        'মোট স্টক', 'বর্তমান স্টক',

        // Telugu
        'స్టాక్', 'నిల్వ', 'పరిమాణం', 'అందుబాటులో', 'మిగిలిన', 'ఎంత', 'ఎన్ని',
        'నా దగ్గర', 'నాకు', 'ఏదైనా గోధుమలు', 'ఏదైనా వరి', 'చూపించు',
        'మొత్తం స్టాక్', 'ప్రస్తుత స్టాక్',

        // Marathi
        'किती', 'काय आहे', 'दाखवा', 'सांगा', 'कुठे आहे', 'किती साठा', 'किती प्रमाण', 'सध्याचा साठा', 'एकूण साठा', 'माझ्याकडे', 'माझा', 'उपलब्ध', 'उरलेला', 'काही', 'काही उत्पादने', 'काही गहू', 'काही तांदूळ',

        // Tamil
        'ஸ்டாக்', 'கையிருப்பு', 'அளவு', 'கிடைக்கும்', 'மிச்சம்', 'எவ்வளவு',
        'என்னிடம்', 'என்', 'ஏதேனும் கோதுமை', 'ஏதேனும் அரிசி', 'காட்டு',
        'மொத்த ஸ்டாக்', 'தற்போதைய ஸ்டாக்',

        // Gujarati
        'સ્ટોક', 'ભંડાર', 'માત્રા', 'ઉપલબ્ધ', 'બાકી', 'કેટલું', 'કેટલા',
        'મારી પાસે', 'મારું', 'કોઈ ઘઉં', 'કોઈ ચોખા', 'બતાવો',
        'કુલ સ્ટોક', 'વર્તમાન સ્ટોક',

        // Kannada
        'ಸ್ಟಾಕ್', 'ಸಂಗ್ರಹ', 'ಪ್ರಮಾಣ', 'ಲಭ್ಯ', 'ಉಳಿದ', 'ಎಷ್ಟು',
        'ನನ್ನ ಬಳಿ', 'ನನ್ನ', 'ಯಾವುದೇ ಗೋಧಿ', 'ಯಾವುದೇ ಅಕ್ಕಿ', 'ತೋರಿಸು',
        'ಒಟ್ಟು ದಾಸ್ತಾನು', 'ಪ್ರಸ್ತುತ ದಾಸ್ತಾನು',

        // Malayalam
        'സ്റ്റോക്ക്', 'സംഭരണം', 'അളവ്', 'ലഭ്യം', 'ബാക്കി', 'എത്ര',
        'എന്റെ കയ്യിൽ', 'എന്റെ', 'എന്തെങ്കിലും ഗോതമ്പ്', 'എന്തെങ്കിലും അരി', 'കാണിക്കൂ',
        'മൊത്തം സ്റ്റോക്ക്', 'നിലവിലെ സ്റ്റോക്ക്',

        // Punjabi
        'ਸਟਾਕ', 'ਭੰਡਾਰ', 'ਮਾਤਰਾ', 'ਉਪਲਬਧ', 'ਬਾਕੀ', 'ਕਿੰਨਾ',
        'ਮੇਰੇ ਕੋਲ', 'ਮੇਰਾ', 'ਕੋਈ ਕਣਕ', 'ਕੋਈ ਚਾਵਲ', 'ਦਿਖਾਓ',
        'ਕੁੱਲ ਸਟਾਕ', 'ਮੌਜੂਦਾ ਸਟਾਕ',

        // Odia
        'ଷ୍ଟକ୍', 'ଭଣ୍ଡାର', 'ପରିମାଣ', 'ଉପଲବ୍ଧ', 'ବାକି', 'କେତେ',
        'ମୋର ପାଖରେ', 'ମୋର', 'କୌଣସି ଗହମ', 'କୌଣସି ଚାଉଳ', 'ଦେଖାଅ',
        'ମୋଟ ଷ୍ଟକ୍', 'ବର୍ତ୍ତମାନ ଷ୍ଟକ୍',

        // Assamese
        'ষ্টक', 'ଭাণ্ডাৰ', 'ପରିମାଣ', 'উপলব্ধ', 'বাকী', 'কিমান',
        'মোৰ ওচৰত', 'মোৰ', 'কোনো ঘেঁহু', 'কোনো চাউল', 'দেখুৱাওক',
        'মুঠ ষ্টक', 'বৰ্তମାନ ষ্টक',

        // Urdu
        'کتنا', 'کتنے', 'کیا ہے', 'دکھاؤ', 'بتاؤ', 'کہاں ہے', 'کتنا اسٹاک', 'کتنی مقدار', 'موجودہ اسٹاک', 'کل اسٹاک', 'میرے پاس', 'میرا', 'دستیاب', 'باقی', 'کوئی', 'کوئی مصنوعات', 'کوئی گندم', 'کوئی چاول'
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
You are an intelligent inventory management assistant for farmers. Your task is to accurately parse natural language instructions (including English, Hindi, Hinglish, and other Indian languages) to update product inventory.

Extract the following information:
1.  **Product name (in English)**: Translate to English if needed. Be specific if a variety is mentioned (e.g., "Basmati rice" not just "rice").
2.  **Action**: Must be one of "increase", "decrease", or "set".
3.  **Quantity**: A numerical value (digits only). Convert written numbers (e.g., "do", "paanch", "fifty") to digits.
4.  **Unit**: The unit of measurement (e.g., "kg", "quintal", "pieces", "bags"). Return "units" if a specific unit isn't mentioned but quantity implies discrete items (e.g., "5 mangoes"). Return null if no unit is mentioned and it's ambiguous.

**Crucial for Accurate Parsing:**
* **Read the ENTIRE query carefully.** Do not stop at the first keyword.
* **Analyze the full meaning and intent.** Is the farmer trying to add, remove, or set a total quantity?
* **Prioritize imperative verbs for action detection.** Words like "घटा दो" (decrease), "बढ़ा दो" (increase), "कर दो" (set/make it) are strong indicators of an instruction, even if other words like "उपलब्ध" (available) are present.
* **"उपलब्ध" (available) when combined with an action verb implies an instruction to modify the *currently available* stock, not a question about it.**

**Understanding Actions:**
* **"increase"**: For adding, harvesting, putting in, collecting, receiving, buying, growing, sowing, replenishing, or any action that *adds* to the current stock.
    * Keywords: 'add', 'increase', 'harvest', 'collected', 'receive', 'buy', 'grow', 'sow', 'plant', 'replenish', 'joڑo', 'badhao', 'dal do', 'kharida', 'ugaya', 'lagaaya', 'prapt kiya', 'mila', 'mil gaya', 'aya hai', 'aaye hain', 'bhar do'.
    * Examples:
        * "स्टॉक में आम 2 किलो बढ़ा दो।" -> { productName: "mango", action: "increase", quantity: 2, unit: "kg" }
        * "आम में 2 किलो बढ़ा दो।" -> { productName: "mango", action: "increase", quantity: 2, unit: "kg" }
        * "Add 3 kg to rice." -> { productName: "rice", action: "increase", quantity: 3, unit: "kg" }
        * "मैंने 5 क्विंटल गेहूं काटा है।" -> { productName: "wheat", action: "increase", quantity: 5, unit: "quintal" }
        * "Put 10 bags of potatoes in inventory." -> { productName: "potato", action: "increase", quantity: 10, unit: "bags" }
        * "गेहूं 10 किलो और डाल दो।" -> { productName: "wheat", action: "increase", quantity: 10, unit: "kg" }
        * "50 पीस टमाटर आए हैं।" -> { productName: "tomato", action: "increase", quantity: 50, unit: "pieces" }
        * "Collected 2 dozen eggs." -> { productName: "egg", action: "increase", quantity: 24, unit: "units" }
        * "धान की फसल 20 क्विंटल हुई है।" -> { productName: "paddy", action: "increase", quantity: 20, unit: "quintal" }
        * "मेरे पास 50 किलो बाजरा आया है।" -> { productName: "millet", action: "increase", quantity: 50, unit: "kg" }
        * "Bought 15 kg of organic carrots." -> { productName: "carrot", action: "increase", quantity: 15, unit: "kg" }
        * "100 gram dhan beej boya." -> { productName: "paddy seed", action: "increase", quantity: 0.1, unit: "kg" } (100 gram = 0.1 kg)
        * "500 gram adrak kharida." -> { productName: "ginger", action: "increase", quantity: 0.5, unit: "kg" }
        * "15 लीटर दूध मिला है।" -> { productName: "milk", action: "increase", quantity: 15, unit: "litres" }
        * "बेंगन 50 नग और आ गए।" -> { productName: "brinjal", action: "increase", quantity: 50, unit: "pieces" }
        * "नया बीज 2 किलो खरीदा।" -> { productName: "seed", action: "increase", quantity: 2, unit: "kg" }

* **"decrease"**: For reducing, selling, using, consuming, wasting, damaging, spoiling, losing, shipping, or any action that *removes* from the current stock.
    * Keywords: 'decrease', 'reduce', 'sold', 'used', 'consume', 'waste', 'damage', 'spoil', 'lose', 'ship', 'ghatao', 'kam karo', 'bech diya', 'kha gaya', 'kharab ho gaya', 'feka', 'nuksan hua', 'jal gaya', 'sad gaya', 'tut gaya', 'khatam ho gaya', 'nikal do'.
    * Examples:
        * "उपलब्ध आम में से 2 किलो घटा दो।" -> { productName: "mango", action: "decrease", quantity: 2, unit: "kg" }
        * "टमाटर 5 किलो कम कर दो।" -> { productName: "tomato", action: "decrease", quantity: 5, unit: "kg" }
        * "I sold 3 kg onions." -> { productName: "onion", action: "decrease", quantity: 3, unit: "kg" }
        * "500 ग्राम अदरक इस्तेमाल हो गया।" -> { productName: "ginger", action: "decrease", quantity: 0.5, unit: "kg" }
        * "गेहूं में से 10 क्विंटल बेच दिया।" -> { productName: "wheat", action: "decrease", quantity: 10, unit: "quintal" }
        * "20 केले खराब हो गए।" -> { productName: "banana", action: "decrease", quantity: 20, unit: "pieces" }
        * "Used 2 litres of pesticide." -> { productName: "pesticide", action: "decrease", quantity: 2, unit: "litres" }
        * "चावल 5 किलो कम कर दो।" -> { productName: "rice", action: "decrease", quantity: 5, unit: "kg" }
        * "300 gram mirchi bech di." -> { productName: "chilli", action: "decrease", quantity: 0.3, unit: "kg" }
        * "5 crates of apples were damaged." -> { productName: "apple", action: "decrease", quantity: 5, unit: "crates" }
        * "10 kg aloo sad gaye." -> { productName: "potato", action: "decrease", quantity: 10, unit: "kg" }
        * "500 ml fertilizer use kiya." -> { productName: "fertilizer", action: "decrease", quantity: 0.5, unit: "litres" }
        * "5 लीटर पानी बर्बाद हो गया।" -> { productName: "water", action: "decrease", quantity: 5, unit: "litres" }
        * "20 पीस ककड़ी टूट गई।" -> { productName: "cucumber", action: "decrease", quantity: 20, unit: "pieces" }
        * "मेरा 10 किलो मक्का चोरी हो गया।" -> { productName: "corn", action: "decrease", quantity: 10, unit: "kg" }

* **"set"**: For explicitly setting the stock to a specific amount, overriding current quantity. This implies the user is stating the *new total*.
    * Keywords: 'set', 'make it', 'itna kar do', 'ab itna hai', 'total is', 'now it is', 'set kar do'.
    * Examples:
        * "Set wheat stock to 50 kg." -> { productName: "wheat", action: "set", quantity: 50, unit: "kg" }
        * "चावल का स्टॉक 100 किलो कर दो।" -> { productName: "rice", action: "set", quantity: 100, unit: "kg" }
        * "Make the potato stock 20 bags." -> { productName: "potato", action: "set", quantity: 20, unit: "bags" }
        * "मेरे पास अब 150 अंडे हैं।" -> { productName: "egg", action: "set", quantity: 150, unit: "units" }
        * "टमाटर का स्टॉक 50 किलो पर सेट कर दो।" -> { productName: "tomato", action: "set", quantity: 50, unit: "kg" }
        * "Ab mere paas 25 quintal makka hai." -> { productName: "corn", action: "set", quantity: 25, unit: "quintal" }
        * "My brinjal stock is now 75 kg." -> { productName: "brinjal", action: "set", quantity: 75, unit: "kg" }
        * "धान का कुल स्टॉक 30 क्विंटल है।" -> { productName: "paddy", action: "set", quantity: 30, unit: "quintal" }
        * "My onion inventory is 100 kg now." -> { productName: "onion", action: "set", quantity: 100, unit: "kg" }

**IMPORTANT CONSIDERATIONS:**
-   **Contextual Understanding**: Infer the action (increase/decrease/set) based on the verb and overall context of the sentence. Pay close attention to phrases indicating addition, removal, or a new total.
-   **Numerical Conversion**: Always convert written numbers (e.g., 'do'=2, 'teen'=3, 'char'=4, 'paanch'=5, 'chhah'=6, 'saat'=7, 'aath'=8, 'nau'=9, 'das'=10, 'gyarah'=11, 'barah'=12, 'bees'=20, 'pachas'=50, 'sau'=100, 'hazaar'=1000, 'lakh'=100000, 'crore'=10000000, 'million'=1000000, 'billion'=1000000000 and their equivalents in other Indian languages) to their digit form.
-   **Unit Inference and Conversion**:
    * If a unit is not explicitly stated but can be reasonably inferred from the product (e.g., "mangoes" implies "pieces" or "units"), use a sensible default.
    * If truly ambiguous, return null for the unit.
    * For "quintal", use "quintal".
    * For "gram" or "gm", convert to "kg" (e.g., 500 gram -> 0.5 kg).
    * For "ml" or "millilitre", convert to "litres" (e.g., 500 ml -> 0.5 litres).
    * For "dozen", convert to "units" (e.g., 2 dozen -> 24 units).
    * For "piece", "nag", "item", use "pieces" or "units".
    * For "bag", "crate", "box", use the specific container unit.
-   **Product Name Specificity**: If the query mentions a specific variety (e.g., "Basmati rice", "Alphonso mango", "desi tamatar", "organic carrots"), extract that specific name. Otherwise, extract the generic product name.
-   **Robustness**: Handle minor typos, grammatical variations, and conversational phrasing naturally.
-   **Confidence Score**: Provide a confidence score (0.0 to 1.0) indicating how certain you are about the extracted information. A higher score means higher certainty.

Query: "${query}"

Return ONLY a JSON object in this exact format. Do NOT include any other text or explanation outside the JSON.
{
  "productName": "product_name_in_english",
  "action": "increase|decrease|set",
  "quantity": number,
  "unit": "unit_or_null",
  "confidence": 0.0-1.0
}
`;

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

        // Translate the entire response string if needed
        if (language && language !== 'en') {
            response = await translateResponse(response, language, genAI);
        }

        return response; // This `response` string is the one that will become `speechAnswer` and `displayAnswer.message`
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
"मा దగ్గర ఎంత మొక్కజొన్న ఉంది?" -> "corn"
"माझ्याकडे किती कांदे आहेत?" -> "onion"
"என்னிடம் எவ்வளவு கத்தரிக்காய் உள்ளது?" -> "eggplant"
"Show me all my inventory" -> "all"
"What is my current stock of Basmati rice and organic tomatoes?" -> "basmati rice, organic tomatoes"
"मेरे पास क्या-क्या है?" -> "all"
"Check all my products" -> "all"

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

                // Generate response message (which will be translated by generateInventoryUpdateResponse)
                const responseMessage = await generateInventoryUpdateResponse(updateResult, query, language, genAI);

                let displayProductData = null;
                if (updateResult.success) {
                    let translatedProductName = updateResult.product.name;
                    let translatedUnit = updateResult.product.unit;

                    // Translate product name and unit for the display object if language is not English
                    if (language && language !== 'en') {
                        translatedProductName = await translateResponse(updateResult.product.name, language, genAI);
                        translatedUnit = await translateResponse(updateResult.product.unit, language, genAI);
                    }

                    displayProductData = {
                        id: updateResult.product._id,
                        name: translatedProductName, // Use translated name
                        oldQuantity: updateResult.oldQuantity,
                        newQuantity: updateResult.newQuantity,
                        change: updateResult.change,
                        unit: translatedUnit, // Use translated unit
                        price: updateResult.product.price,
                        currentValue: (updateResult.newQuantity * updateResult.product.price).toFixed(2)
                    };
                }

                return res.json({
                    success: true,
                    data: {
                        query: query,
                        answer: responseMessage, // This is already translated
                        speechAnswer: responseMessage, // This is already translated
                        displayAnswer: updateResult.success ? {
                            message: responseMessage, // This is already translated
                            product: displayProductData // This now contains translated name/unit
                        } : responseMessage, // This is already translated
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
            { code: 'te', name: 'Telugu (తెలుగు)', nativeName: 'తెలుగు' },
            { code: 'mr', name: 'Marathi (मराठी)', nativeName: 'मराठी' },
            { code: 'ta', name: 'Tamil (தமிழ்)', nativeName: 'தமிழ்' },
            { code: 'gu', name: 'Gujarati (ગુજરાતી)', nativeName: 'ગુજરાતી' },
            { code: 'kn', name: 'Kannada (ಕನ್ನಡ)', nativeName: 'ಕನ್ನಡ' },
            { code: 'ml', name: 'Malayalam (മലയാളം)', nativeName: 'മലയാളം' },
            { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)', nativeName: 'ਪੰਜਾਬੀ' },
            { code: 'or', name: 'Odia (ଓଡ଼ିଆ)', nativeName: 'ଓଡ଼ିଆ' },
            { code: 'as', name: 'Assamese (অসমীয়া)', nativeName: 'অসমীয়া' },
            { code: 'ur', name: 'Urdu (اردو)', nativeName: 'اردو' }
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
                as: "মোৰ ଓଚৰত কিমান ঘেঁಹು ষ্টकत আছে?",
                ur: "میرے پاس کتنا گندम اسٹاک میں ہے؟"
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
                ml: "ಎന്റെ മുഴുവൻ ഇൻവെന്ററിയும் കാണിക്കൂ",
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
                ml: "മാമ്പழ ಸ್ಟോക്ക് 2 ಕിലോ കുറയ്ക്കുക",
                pa: "ਅੰਬ ਦਾ ਸਟਾਕ 2 ਕਿਲੋ ਘਟਾਓ",
                or: "ଆମ୍ବ ଷ୍ଟକ୍ 2 କିଲୋ କମ୍ କରନ୍ତୁ",
                as: "আম ষ্টक ২ কিলো কমাওক",
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
                ml: "5 കിലോ കൊയ്ത തക്കാളി স্টোക്കിൽ ചേർക്കുക",
                pa: "5 ਕਿਲੋ ਕਟੇ ਟਮਾਟਰ ਸਟਾਕ ਵਿੱਚ ਜੋੜੋ",
                or: "5 କିଲୋ କଟା ଟମାଟୋ ଷ୍ଟକରେ ଯୋଗ କରନ୍ତୁ",
                as: "5 কিলো কটা টমেটো ষ্টকত যোগ কৰক",
                ur: "5 کلو کاٹے گئے ٹماٹر اسٹاک میں شامل کریں"
            },
            {
                en: "I sold 3 kg onions, update my stock",
                hi: "मैंने 3 किलो प्याज बेचे, मेरा स्टॉक अपडेट करें",
                bn: "আমি 3 কেজি পেঁয়াজ বিক্রি করেছি, আমার স্টক আপডেট করুন",
                te: "నేను 3 కిలోల ఉల్లిపాయలు అమ్మాను, నా స్టాక్‌ను అప్‌డేট చేయండి",
                mr: "मी 3 किलो कांदे विकले, माझा साठा अद्ययावत करा",
                ta: "நான் 3 கிலோ வெங்காயம் விற்றேன், எனது ஸ்டாக்கை புதுப்பிக்கவும்",
                gu: "મેં 3 કિલો ડુંગળી વેચ્યા, મારો સ્ટોક અપડેટ કરો",
                kn: "ನಾನು 3 ಕಿಲೋ ಈರುಳ್ಳಿ ಮಾರಿದೆ, ನನ್ನ ಸ್ಟಾಕ್ ಅಪ್‌ಡೇಟ್ ಮಾಡಿ",
                ml: "ഞാൻ 3 കിലോ ഉള്ളി വിറ്റു, എന്റെ സ്റ്റोക്ക് അപ്ഡേറ്റ് ചെയ്യുക",
                pa: "ਮੈਂ 3 ਕਿਲੋ ਪਿਆਜ਼ ਵੇਚੇ, ਮੇਰਾ ਸਟਾਕ ਅਪਡੇਟ ਕਰੋ",
                or: "ମୁଁ 3 କିଲୋ ପିଆଜ ବିକ୍ରି କଲି, ମୋର ଷ୍ଟକ୍ ଅପଡେଟ୍ କରନ୍ତୁ",
                as: "মই 3 কিলো পিয়াজ বিক্ৰੀ কৰਿਲোঁ, মোৰ ষ্টक আপডেট কৰক",
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
                ml: "ജൈವകൃഷിയിൽ കീടങ്ങളെ എങ്ങനെ നിയന്ത്രിക്കാം?",
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

TASK: Convert the following text into natural, conversational speech in ${targetLanguage}.
Ensure the output is clean, direct, and immediately usable for text-to-speech.

CRITICAL INSTRUCTIONS FOR OUTPUT:
-   **START IMMEDIATELY with the actual content.** Do NOT include any introductory phrases, explanations, meta-commentary, or conversational fillers from the AI (e.g., "Here's the English conversion:", "हाँ, यह हिंदी में है:", "Ok, here it is:").
-   **No Formatting Symbols**: Do NOT use asterisks (*), bullet points, numbers, or any other markdown formatting. The output should be plain, natural speech.
-   **Convert Numbers to Words**: Always convert numerical digits (e.g., "50", "2.5") into their spoken word equivalents (e.g., "fifty", "two point five"). This applies to all languages.
-   **Include All Details**: Ensure quantities, prices (e.g., "₹50" should be "fifty rupees"), dates (e.g., "harvested on 15 July 2024" should be spoken naturally), and product names are included and pronounced correctly.
-   **Maintain Conversational Flow**: The response should sound like a natural conversation between two farmers.
-   **Handle All Cases**: Be robust to various inputs and always provide a natural speech output.

Example Conversions:
-   **English Input**: "You have 50 kg of rice worth ₹2500. Harvested on 15 July 2024."
    **English Output**: "You have fifty kilograms of rice worth twenty-five hundred rupees. Harvested on fifteenth July two thousand twenty-four."

-   **Hindi Input**: "आपके पास 50 किलो चावल है, जिसकी कीमत ₹2500 है। 15 जुलाई 2024 को काटा गया।"
    **Hindi Output**: "आपके पास पचास किलो चावल है, जिसकी कीमत पच्चीस सौ रुपये है। पंद्रह जुलाई दो हज़ार चौबीस को काटा गया।"

-   **Hinglish Input**: "Mera stock 100 kg gehu ho gaya hai."
    **Hinglish Output**: "Mera stock sau kilo gehu ho gaya hai."

-   **Bengali Input**: "আপনার কাছে 25 কেজি টমেটো আছে।"
    **Bengali Output**: "আপনার কাছে পঁচিশ কেজি টমেটো আছে।"

-   **Telugu Input**: "నా దగ్గర 10 క్వింటాళ్ల మొక్కజొన్న ఉంది।"
    **Telugu Output**: "నా దగ్గర పది క్వింటాళ్ల మొక్కజొన్న ఉంది।"

-   **Marathi Input**: "माझ्याकडे 500 ग्रॅम आले आहे।"
    **Marathi Output**: "माझ्याकडे पाचशे ग्रॅम आले आहे।"

-   **Tamil Input**: "என்னிடம் 12 பைகள் உருளைக்கிழங்கு உள்ளது।"
    **Tamil Output**: "என்னிடம் பன்னிரண்டு பைகள் உருளைக்கிழங்கு உள்ளது।"

-   **Gujarati Input**: "મારી પાસે 5 ડઝન ઇંડા છે।"
    **Gujarati Output**: "મારી પાસે પાંચ ડઝન ઇંડા છે।"

-   **Kannada Input**: "ನನ್ನ ಬಳಿ 20 ಲೀಟರ್ ಹಾಲು ಇದೆ।"
    **Kannada Output**: "ನನ್ನ ಬಳಿ ಇಪ್ಪತ್ತು ಲೀಟರ್ ಹಾಲು ಇದೆ।"

-   **Malayalam Input**: "എന്റെ കയ്യിൽ 30 കilo പയർ ഉണ്ട്।"
    **Malayalam Output**: "എന്റെ കയ്യിൽ മുപ്പത് കിലോ പയർ ഉണ്ട്।"

-   **Punjabi Input**: "ਮੇਰੇ ਕੋਲ 5 ਕਵਿੰਟਲ ਕਣਕ ਹੈ।"
    **Punjabi Output**: "ਮੇਰੇ ਕੋਲ ਪੰਜ ਕਵਿੰਟਲ ਕਣਕ ਹੈ।"

-   **Odia Input**: "ମୋର 10 କିଲୋ ବାଇଗଣ ଅଛି।"
    **Odia Output**: "ମୋର ଦଶ କିଲୋ ବାଇଗଣ ଅଛି।"

-   **Assamese Input**: "মোৰ ଓଚৰত 250 গ্ৰাম আদা আছে।"
    **Assamese Output**: "মোৰ ଓচৰত দুশ পঞ্চাশ গ্ৰাম আদা আছে।"

-   **Urdu Input**: "میرے پاس 50 کلو چاول ہیں۔"
    **Urdu Output**: "मेरे पास پچاس کلو چاول ہیں۔"

Text: "${text}"

Response (${targetLanguage}, direct content only):`;

        const result = await model.generateContent(prompt);

        if (!result || !result.response) {
            throw new Error("Empty response from Gemini API");
        }

        const response = await result.response;
        let smartText = response.text().trim();

        // No client-side cleanup for prefixes, relying on model's adherence to prompt.
        // Basic cleanup for markdown artifacts that might still slip through.
        smartText = smartText
            .replace(/^["'*]+|["'*]+$/g, "") // Remove leading/trailing quotes or asterisks
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
            .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
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
        const speechPrompt = `
ROLE: You are an expert agricultural advisor specializing in Indian farming practices.
TASK: Provide a concise, conversational, and actionable response to the farmer's query.
This response is optimized for text-to-speech, so it must sound natural when spoken aloud.

CRITICAL INSTRUCTIONS FOR OUTPUT:
-   **START IMMEDIATELY with the actual content.** Do NOT include any introductory phrases, explanations, meta-commentary, or conversational fillers from the AI (e.g., "Here's the answer:", "हाँ, यह है:", "Ok, here it is:").
-   **No Formatting Symbols**: Do NOT use asterisks (*), bullet points, numbers, or any other markdown formatting. The output should be plain, natural speech.
-   **Convert Numbers to Words**: Always convert numerical digits (e.g., "50", "2.5") into their spoken word equivalents (e.g., "fifty", "two point five").
-   **Keep it Concise**: Aim for under 100 words.
-   **Be Direct and Actionable**: Provide practical advice that a farmer can immediately use.
-   **Focus on Indian Farming**: Tailor advice to common Indian crops, seasons, and challenges.
-   **Cover all 13 supported languages naturally**: Ensure the response is fluent and accurate in the requested language.

Query: "${query}"

${language && language !== 'en' ? `Please respond in ${language} language.` : ''}

Provide a brief, conversational, and actionable answer:`;

        // Generate detailed display response
        const displayPrompt = `
ROLE: You are an expert agricultural advisor specializing in Indian farming practices.
TASK: Provide a comprehensive, detailed, and well-structured response to the farmer's query.
This response is optimized for screen display, so it should be easy to read and digest.

CRITICAL INSTRUCTIONS FOR OUTPUT:
-   **START IMMEDIATELY with the actual content.** Do NOT include any introductory phrases, explanations, or meta-commentary from the AI (e.g., "Here's the detailed answer:", "यहाँ विस्तृत जानकारी है:", "Please find the information below:").
-   **No Formatting Symbols**: Do NOT use asterisks (*), bolding, bullet points, numbers, or any other markdown formatting. The output should be plain text.
-   **Use Clear Sections/Paragraphs**: Organize information logically with clear paragraphs. You can use line breaks for separation.
-   **Include Specific Recommendations**: Provide concrete, practical steps or suggestions.
-   **Add Relevant Context and Explanations**: Elaborate on the advice, explaining the "why" behind recommendations.
-   **Focus on Indian Farming Conditions**: Ensure the advice is relevant to Indian agricultural practices, climate, and common issues.
-   **Be Comprehensive but not Overly Verbose**: Provide enough detail without overwhelming the user.
-   **Cover all 13 supported languages naturally**: Ensure the response is fluent and accurate in the requested language.

Query: "${query}"

${language && language !== 'en' ? `Please respond in ${language} language.` : ''}

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
- Cover all 13 supported languages naturally.

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
