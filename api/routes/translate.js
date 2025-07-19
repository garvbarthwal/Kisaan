const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Supported languages configuration
const SUPPORTED_LANGUAGES = {
  'en': { name: 'English', nativeName: 'English' },
  'hi': { name: 'Hindi', nativeName: 'हिंदी' },
  'bn': { name: 'Bengali', nativeName: 'বাংলা' },
  'te': { name: 'Telugu', nativeName: 'తెలుగు' },
  'mr': { name: 'Marathi', nativeName: 'मराठी' },
  'ta': { name: 'Tamil', nativeName: 'தமிழ்' },
  'gu': { name: 'Gujarati', nativeName: 'ગુજરાતી' },
  'kn': { name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  'ml': { name: 'Malayalam', nativeName: 'മലയാളം' },
  'pa': { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  'or': { name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  'as': { name: 'Assamese', nativeName: 'অসমীয়া' },
  'ur': { name: 'Urdu', nativeName: 'اردو' }
};

// Enhanced utility prompt builder for multi-language translation
const buildPrompt = (text, targetLanguage = 'hi', sourceLanguage = 'auto') => {
  const targetLangInfo = SUPPORTED_LANGUAGES[targetLanguage] || SUPPORTED_LANGUAGES['hi'];

  return `
You are an expert multilingual translator and agricultural assistant for Indian farmers and consumers. You have deep knowledge about:
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

TASK: Translate the following message to ${targetLangInfo.name} (${targetLangInfo.nativeName}). 

CRITICAL RULES:
- Only return the translated text in ${targetLangInfo.name}
- Do not include the original text, explanations, or formatting
- Preserve the meaning and context, especially agricultural terms
- Keep numbers, dates, and currency symbols as they are
- Make the translation natural and conversational
- Understand that this is a conversation between farmers/consumers
- If the text is already in ${targetLangInfo.name}, return it as is

Message to translate:
"${text}"

${targetLangInfo.name} translation:`.trim();
};

// Generate button texts in user's language
const generateButtonTexts = (userLanguage, targetLanguage) => {
  const buttonTexts = {
    'en': {
      translate: `See in ${SUPPORTED_LANGUAGES[targetLanguage]?.nativeName || 'Target Language'}`,
      showOriginal: 'Show Original'
    },
    'hi': {
      translate: `${SUPPORTED_LANGUAGES[targetLanguage]?.nativeName || 'लक्षित भाषा'} में देखें`,
      showOriginal: 'मूल रूप देखें'
    },
    'bn': {
      translate: `${SUPPORTED_LANGUAGES[targetLanguage]?.nativeName || 'লক্ষ্য ভাষা'}য় দেখুন`,
      showOriginal: 'মূল দেখুন'
    },
    'te': {
      translate: `${SUPPORTED_LANGUAGES[targetLanguage]?.nativeName || 'లక్ష్య భాష'}లో చూడండి`,
      showOriginal: 'అసలైనది చూడండి'
    },
    'mr': {
      translate: `${SUPPORTED_LANGUAGES[targetLanguage]?.nativeName || 'लक्ष्य भाषा'}मध्ये पहा`,
      showOriginal: 'मूळ पहा'
    },
    'ta': {
      translate: `${SUPPORTED_LANGUAGES[targetLanguage]?.nativeName || 'இலக்கு மொழி'}ல் பார்க்கவும்`,
      showOriginal: 'அசலைப் பார்க்கவும்'
    },
    'gu': {
      translate: `${SUPPORTED_LANGUAGES[targetLanguage]?.nativeName || 'લક્ષ્ય ભાષા'}માં જુઓ`,
      showOriginal: 'મૂળ જુઓ'
    },
    'kn': {
      translate: `${SUPPORTED_LANGUAGES[targetLanguage]?.nativeName || 'ಗುರಿ ಭಾಷೆ'}ಯಲ್ಲಿ ನೋಡಿ`,
      showOriginal: 'ಮೂಲ ನೋಡಿ'
    },
    'ml': {
      translate: `${SUPPORTED_LANGUAGES[targetLanguage]?.nativeName || 'ലക്ഷ്യ ഭാഷ'}യിൽ കാണുക`,
      showOriginal: 'മൂലം കാണുക'
    },
    'pa': {
      translate: `${SUPPORTED_LANGUAGES[targetLanguage]?.nativeName || 'ਟਾਰਗੇਟ ਭਾਸ਼ਾ'} ਵਿੱਚ ਦੇਖੋ`,
      showOriginal: 'ਮੂਲ ਦੇਖੋ'
    },
    'or': {
      translate: `${SUPPORTED_LANGUAGES[targetLanguage]?.nativeName || 'ଲକ୍ଷ୍ୟ ଭାଷା'}ରେ ଦେଖନ୍ତୁ`,
      showOriginal: 'ମୂଳ ଦେଖନ୍ତୁ'
    },
    'as': {
      translate: `${SUPPORTED_LANGUAGES[targetLanguage]?.nativeName || 'লক্ষ্য ভাষা'}ত চাওক`,
      showOriginal: 'মূল চাওক'
    },
    'ur': {
      translate: `${SUPPORTED_LANGUAGES[targetLanguage]?.nativeName || 'ہدف زبان'} میں دیکھیں`,
      showOriginal: 'اصل دیکھیں'
    }
  };

  return buttonTexts[userLanguage] || buttonTexts['en'];
};

// POST /api/translate - Enhanced multi-language translation endpoint
router.post("/", async (req, res) => {
  const { text, targetLanguage = 'hi', sourceLanguage = 'auto', userLanguage = 'en' } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required for translation" });
  }

  // Validate target language
  if (!SUPPORTED_LANGUAGES[targetLanguage]) {
    return res.status(400).json({
      error: "Unsupported target language",
      supportedLanguages: Object.keys(SUPPORTED_LANGUAGES)
    });
  }

  // Validate user language (for button texts)
  if (!SUPPORTED_LANGUAGES[userLanguage]) {
    return res.status(400).json({
      error: "Unsupported user language",
      supportedLanguages: Object.keys(SUPPORTED_LANGUAGES)
    });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent translations
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    const result = await model.generateContent(buildPrompt(text, targetLanguage, sourceLanguage));

    if (!result || !result.response) {
      throw new Error("Empty response from Gemini API");
    }

    const response = await result.response;
    const translatedText = response.text().trim();

    // Clean up the translation - remove quotes, asterisks, markdown artifacts
    const cleanText = translatedText
      .replace(/^["'*`]+|["'*`]+$/g, "")
      .replace(/^(translation\s*in\s*\w+)[:\s,.]*/gi, '')
      .replace(/^(अनुवाद|অনুবাদ|అనువాదం|अनुवाद|மொழிபெயர்ப்பு|અનુવાદ|ಅನುವಾದ|പരിഭാഷ|ਅਨੁਵਾਦ|ଅନୁବାଦ|অনুবাদ|ترجمہ)[:\s,.]*/gi, '')
      .trim();

    // Generate button texts in user's language
    const buttonTexts = generateButtonTexts(userLanguage, targetLanguage);

    res.json({
      translated: cleanText || "Translation unavailable",
      targetLanguage: targetLanguage,
      sourceLanguage: sourceLanguage,
      buttonTexts: buttonTexts
    });
  } catch (err) {
    console.error("Translation error:", err);

    // Enhanced fallback translations for different languages
    const fallbackMessages = {
      'hi': "अनुवाद सेवा अस्थायी रूप से उपलब्ध नहीं है।",
      'bn': "অনুবাদ সেবা সাময়িকভাবে উপলব্ধ নয়।",
      'te': "అనువాద సేవ తాత్కాలికంగా అందుబాటులో లేదు।",
      'mr': "भाषांतर सेवा तात्पुरती उपलब्ध नाही.",
      'ta': "மொழிபெயர்ப்பு சேவை தற்காலிகமாக கிடைக்கவில்லை.",
      'gu': "અનુવાદ સેવા અસ્થાયી રૂપે ઉપલબ્ધ નથી.",
      'kn': "ಅನುವಾದ ಸೇವೆ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ.",
      'ml': "പരിഭാഷാ സേവനം താൽക്കാലികമായി ലഭ്യമല്ല.",
      'pa': "ਅਨੁਵਾਦ ਸੇਵਾ ਅਸਥਾਈ ਤੌਰ 'ਤੇ ਉਪਲਬਧ ਨਹੀਂ ਹੈ।",
      'or': "ଅନୁବାଦ ସେବା ଅସ୍ଥାୟୀ ଭାବରେ ଉପଲବ୍ଧ ନାହିଁ।",
      'as': "অনুবাদ সেৱা সাময়িকভাৱে উপলব্ধ নহয়।",
      'ur': "ترجمے کی سہولت عارضی طور پر دستیاب نہیں ہے۔",
      'en': "Translation service temporarily unavailable."
    };

    // Handle API errors with appropriate fallback messages
    if (err.message.includes("API key") ||
      err.message.includes("quota") ||
      err.message.includes("GEMINI_API_KEY")) {
      const fallbackMessage = fallbackMessages[targetLanguage] || fallbackMessages['en'];
      const buttonTexts = generateButtonTexts(userLanguage, targetLanguage);
      return res.json({
        translated: fallbackMessage,
        targetLanguage: targetLanguage,
        sourceLanguage: sourceLanguage,
        buttonTexts: buttonTexts,
        fallback: true
      });
    }

    res.status(500).json({
      error: "Translation failed",
      details: err.message,
      targetLanguage: targetLanguage
    });
  }
});

module.exports = router;
