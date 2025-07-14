// Text-to-Speech utility using Web Speech API
class TextToSpeechService {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.isSupported = 'speechSynthesis' in window;
        this.currentUtterance = null;
        this.smartTextCache = new Map(); // Cache for smart text generation

        // Load voices when they become available
        this.loadVoices();

        // Reload voices when they change (some browsers load voices asynchronously)
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.loadVoices();
        }
    }

    loadVoices() {
        this.voices = this.synth.getVoices();
    }

    // Get the best available voice for a given language
    getVoiceForLanguage(languageCode) {
        if (!this.voices.length) {
            this.loadVoices();
        }

        // Language priority mapping for Indian languages
        const languagePriority = {
            'en': ['en-IN', 'en-US', 'en-GB', 'en'],
            'hi': ['hi-IN', 'hi'],
            'bn': ['bn-IN', 'bn-BD', 'bn'],
            'te': ['te-IN', 'te'],
            'mr': ['mr-IN', 'mr'],
            'ta': ['ta-IN', 'ta-LK', 'ta'],
            'gu': ['gu-IN', 'gu'],
            'kn': ['kn-IN', 'kn'],
            'ml': ['ml-IN', 'ml'],
            'pa': ['pa-IN', 'pa-PK', 'pa'],
            'or': ['or-IN', 'or'],
            'as': ['as-IN', 'as'],
            'ur': ['ur-PK', 'ur-IN', 'ur']
        };

        const preferredLangs = languagePriority[languageCode] || ['en-IN', 'en'];

        // Try to find the best matching voice
        for (const lang of preferredLangs) {
            const voice = this.voices.find(v =>
                v.lang.toLowerCase().startsWith(lang.toLowerCase())
            );
            if (voice) return voice;
        }

        // Fallback to any voice that starts with the language code
        const fallbackVoice = this.voices.find(v =>
            v.lang.toLowerCase().startsWith(languageCode.toLowerCase())
        );

        if (fallbackVoice) return fallbackVoice;

        // Final fallback to English
        return this.voices.find(v => v.lang.toLowerCase().startsWith('en')) || this.voices[0];
    }

    // Speak the given text in the specified language
    speak(text, languageCode = 'en', options = {}) {
        return new Promise((resolve, reject) => {
            if (!this.isSupported) {
                reject(new Error('Text-to-speech is not supported in this browser'));
                return;
            }

            if (!text || text.trim() === '') {
                reject(new Error('No text provided'));
                return;
            }

            // Stop any current speech
            this.stop();

            try {
                const utterance = new SpeechSynthesisUtterance(text);
                this.currentUtterance = utterance;

                // Get the appropriate voice
                const voice = this.getVoiceForLanguage(languageCode);
                if (voice) {
                    utterance.voice = voice;
                    utterance.lang = voice.lang;
                } else {
                    // Set language even if no specific voice is found
                    const languageMap = {
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
                    utterance.lang = languageMap[languageCode] || 'en-IN';
                }

                // Set speech parameters
                utterance.rate = options.rate || 0.9; // Slightly slower for better comprehension
                utterance.pitch = options.pitch || 1;
                utterance.volume = options.volume || 0.8;

                // Event handlers
                utterance.onend = () => {
                    this.currentUtterance = null;
                    resolve();
                };

                utterance.onerror = (event) => {
                    this.currentUtterance = null;
                    // Don't reject for interruption - it's expected behavior when manually stopped
                    if (event.error === 'interrupted') {
                        resolve();
                    } else {
                        reject(new Error(`Speech synthesis error: ${event.error}`));
                    }
                };

                utterance.onstart = () => {
                    // Speech started
                };

                // Start speaking
                this.synth.speak(utterance);

            } catch (error) {
                reject(error);
            }
        });
    }

    // Stop current speech
    stop() {
        if (this.synth.speaking) {
            this.synth.cancel();
        }
        this.currentUtterance = null;
    }

    // Check if currently speaking
    isSpeaking() {
        return this.synth.speaking;
    }

    // Pause current speech
    pause() {
        if (this.synth.speaking) {
            this.synth.pause();
        }
    }

    // Resume paused speech
    resume() {
        if (this.synth.paused) {
            this.synth.resume();
        }
    }

    // Get available voices for a language
    getAvailableVoices(languageCode) {
        if (!this.voices.length) {
            this.loadVoices();
        }

        return this.voices.filter(voice =>
            voice.lang.toLowerCase().startsWith(languageCode.toLowerCase())
        );
    }

    // Check if TTS is supported
    isTextToSpeechSupported() {
        return this.isSupported;
    }

    // Generate smart, human-like speech text using Gemini
    async generateSmartSpeechText(text, languageCode = 'en') {
        // Create cache key
        const cacheKey = `${languageCode}:${text.substring(0, 100)}`;

        // Check cache first
        if (this.smartTextCache.has(cacheKey)) {
            return this.smartTextCache.get(cacheKey);
        }

        try {
            const response = await fetch('/api/ai/generate-speech-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    text: text,
                    language: languageCode
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to generate smart speech text`);
            }

            const data = await response.json();

            if (data.success && data.data && data.data.smartText) {
                const smartText = data.data.smartText;

                // Additional client-side cleanup for extra natural speech
                const cleanedText = this.finalCleanupForSpeech(smartText, languageCode);

                // Cache the result (limit cache size to prevent memory issues)
                if (this.smartTextCache.size > 100) {
                    const firstKey = this.smartTextCache.keys().next().value;
                    this.smartTextCache.delete(firstKey);
                }
                this.smartTextCache.set(cacheKey, cleanedText);

                return cleanedText;
            } else {
                return this.preprocessTextForSpeech(text, languageCode);
            }
        } catch (error) {
            return this.preprocessTextForSpeech(text, languageCode); // Fallback to local processing
        }
    }

    // Final cleanup for even more natural speech
    finalCleanupForSpeech(text, languageCode = 'en') {
        let cleanedText = text;

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
            cleanedText = cleanedText.replace(regex, '').trim();
        });

        // Additional cleanup for any remaining conversation artifacts
        cleanedText = cleanedText
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
            .replace(/^(یقینی|ٹھیک|اچھا|صحیح)[,.\s]*/gi, '');

        // Remove any remaining technical artifacts
        cleanedText = cleanedText
            // Remove any remaining markdown or formatting
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')

            // Ensure no .00 values slip through - this is critical for natural speech
            .replace(/(\d+)\.00/g, '$1')
            .replace(/₹(\d+)\.00/g, (match, number) => {
                if (languageCode === 'hi') {
                    return `${this.convertNumberToHindi(number)} रुपये`;
                }
                return `${this.convertNumberToWords(number)} rupees`;
            })

            // Clean up any remaining parenthetical expressions
            .replace(/\s*\([^)]*\)\s*/g, ' ')
            .replace(/\s*\[[^\]]*\]\s*/g, ' ')

            // Make currency more natural
            .replace(/रुपये\s*(\d+)/g, '$1 रुपये') // Ensure number comes before rupees
            .replace(/rupees\s*(\d+)/g, '$1 rupees')

            // Clean up any structural artifacts that might remain
            .replace(/:\s*\n/g, ': ')
            .replace(/\n+/g, '. ')
            .replace(/\s*-\s*/g, ' ')

            // Clean up any double spaces or excessive punctuation
            .replace(/\s+/g, ' ')
            .replace(/\.{2,}/g, '.')
            .replace(/,{2,}/g, ',')
            .replace(/\?{2,}/g, '?')
            .replace(/!{2,}/g, '!')

            // Add natural pauses for better speech flow
            .replace(/\.\s*/g, '. ')
            .replace(/,\s*/g, ', ')
            .replace(/\?\s*/g, '? ')
            .replace(/!\s*/g, '! ')

            // Clean up any remaining overly conversational phrases that might slip through
            .replace(/देखिए मित्र[,\s]*/gi, '')
            .replace(/आपके पास तो[,\s]*/gi, '')
            .replace(/यह तो बढ़िया है[,\s]*/gi, '')
            .replace(/look friend[,\s]*/gi, '')
            .replace(/you have[,\s]*/gi, '')
            .replace(/that's great[,\s]*/gi, '')

            // Ensure harvest date information is preserved and natural
            .replace(/Harvest Date:/gi, languageCode === 'hi' ? 'कटाई की तारीख:' : 'Harvested on:')
            .replace(/Harvested on:/gi, languageCode === 'hi' ? 'कटाई:' : 'Harvested on:')

            // Fix specific harvest date patterns that might get broken
            .replace(/harvested on (\d{1,2}) (\w+) (\d{4})/gi, (match, day, month, year) => {
                if (languageCode === 'hi') {
                    return `${this.convertNumberToHindi(day)} ${this.getMonthInHindi(month)} ${this.convertNumberToHindi(year)} को काटा गया`;
                }
                return `harvested on ${day} ${month} ${year}`;
            })

            // Keep only essential connecting words
            .replace(/Summary\s*:/gi, languageCode === 'hi' ? 'कुल मिलाकर:' : 'Total:')
            .replace(/Total\s*:/gi, languageCode === 'hi' ? 'कुल:' : 'Total:')
            .replace(/Available\s*:/gi, languageCode === 'hi' ? 'उपलब्ध:' : 'Available:')

            // Ensure proper sentence endings
            .trim();

        // Add a natural ending if the text doesn't end with punctuation
        if (cleanedText && !cleanedText.match(/[।.!?]$/)) {
            if (languageCode === 'hi') {
                cleanedText += '।';
            } else {
                cleanedText += '.';
            }
        }

        return cleanedText;
    }

    // Local text preprocessing for speech (fallback method)
    preprocessTextForSpeech(text, languageCode = 'en') {
        let processedText = text;

        // Remove or replace problematic elements
        processedText = processedText
            // Remove markdown formatting
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/#{1,6}\s*(.*)/g, '$1')

            // Handle currency more naturally - NEVER say .00
            .replace(/₹(\d+)\.00/g, (match, number) => {
                const numStr = parseInt(number).toString();
                if (languageCode === 'hi') {
                    return this.convertNumberToHindi(numStr) + ' रुपये';
                } else if (languageCode === 'bn') {
                    return `${numStr} টাকা`;
                } else if (languageCode === 'te') {
                    return `${numStr} రూపాయలు`;
                } else if (languageCode === 'mr') {
                    return this.convertNumberToMarathi(numStr) + ' रुपये';
                } else if (languageCode === 'ta') {
                    return `${numStr} ரூபாய்`;
                } else if (languageCode === 'gu') {
                    return `${numStr} રૂપિયા`;
                } else if (languageCode === 'kn') {
                    return `${numStr} ರೂಪಾಯಿಗಳು`;
                } else if (languageCode === 'ml') {
                    return `${numStr} രൂപ`;
                } else if (languageCode === 'pa') {
                    return `${numStr} ਰੁਪਏ`;
                } else if (languageCode === 'ur') {
                    return `${numStr} روپے`;
                }
                return this.convertNumberToWords(numStr) + ' rupees';
            })

            // Handle any other decimal currency amounts
            .replace(/₹(\d+\.\d+)/g, (match, number) => {
                const [rupees, paise] = number.split('.');
                if (paise === '00') {
                    if (languageCode === 'hi') {
                        return this.convertNumberToHindi(rupees) + ' रुपये';
                    }
                    return this.convertNumberToWords(rupees) + ' rupees';
                } else {
                    if (languageCode === 'hi') {
                        return this.convertNumberToHindi(rupees) + ' रुपये ' + this.convertNumberToHindi(paise) + ' पैसे';
                    }
                    return this.convertNumberToWords(rupees) + ' rupees and ' + this.convertNumberToWords(paise) + ' paise';
                }
            })

            // Handle plain numbers more naturally
            .replace(/\b(\d+)\b/g, (match, number) => {
                if (languageCode === 'hi') {
                    return this.convertNumberToHindi(number);
                }
                return this.convertNumberToWords(number);
            })

            // Handle weight units more naturally
            .replace(/(\d+)\s*किलो\s*\(kg\)/g, (match, number) => {
                if (languageCode === 'hi') {
                    return this.convertNumberToHindi(number) + ' किलो';
                }
                return this.convertNumberToWords(number) + ' किलो';
            })
            .replace(/(\d+)\s*kg/gi, (match, number) => {
                if (languageCode === 'hi') {
                    return this.convertNumberToHindi(number) + ' किलो';
                } else if (languageCode === 'bn') {
                    return `${this.convertNumberToBengali(number)} কেজি`;
                } else if (languageCode === 'te') {
                    return `${number} కిలో`;
                } else if (languageCode === 'mr') {
                    return this.convertNumberToMarathi(number) + ' किलो';
                } else if (languageCode === 'ta') {
                    return `${number} கிலோ`;
                } else if (languageCode === 'gu') {
                    return `${number} કિલો`;
                } else if (languageCode === 'kn') {
                    return `${number} ಕಿಲೋ`;
                } else if (languageCode === 'ml') {
                    return `${number} കിലോ`;
                } else if (languageCode === 'pa') {
                    return `${number} ਕਿਲੋ`;
                } else if (languageCode === 'ur') {
                    return `${number} کلو`;
                }
                return this.convertNumberToWords(number) + ' kilograms';
            })

            // Remove parenthetical translations and technical details
            .replace(/\([^)]*\)/g, '')
            .replace(/\[[^\]]*\]/g, '')

            // Handle structured content more naturally but directly
            .replace(/^\d+\.\s*/gm, '')
            .replace(/^[-*•]\s*/gm, '')

            // Replace formal headers with direct statements
            .replace(/Summary:/gi, languageCode === 'hi' ? 'कुल मिलाकर:' : 'Total:')
            .replace(/Total:/gi, languageCode === 'hi' ? 'कुल' : 'Total')
            .replace(/Available:/gi, languageCode === 'hi' ? 'उपलब्ध' : 'Available')
            .replace(/Category:/gi, languageCode === 'hi' ? 'श्रेणी:' : 'Category:')
            .replace(/Type:/gi, languageCode === 'hi' ? 'किस्म:' : 'Type:')
            .replace(/Price:/gi, languageCode === 'hi' ? 'दाम:' : 'Price:')
            .replace(/Quantity:/gi, languageCode === 'hi' ? 'मात्रा:' : 'Quantity:')

            // Handle dates more naturally - ensure harvest dates are spoken clearly
            .replace(/Harvested on:\s*(\d{1,2})\s*(\w+)\s*(\d{4})/g, (match, day, month, year) => {
                if (languageCode === 'hi') {
                    const months = {
                        'January': 'जनवरी', 'February': 'फरवरी', 'March': 'मार्च', 'April': 'अप्रैल',
                        'May': 'मई', 'June': 'जून', 'July': 'जुलाई', 'August': 'अगस्त',
                        'September': 'सितंबर', 'October': 'अक्टूबर', 'November': 'नवंबर', 'December': 'दिसंबर'
                    };
                    return `${this.convertNumberToHindi(day)} ${months[month] || month} को काटा गया`;
                } else if (languageCode === 'bn') {
                    const months = {
                        'January': 'জানুয়ারী', 'February': 'ফেব্রুয়ারী', 'March': 'মার্চ', 'April': 'এপ্রিল',
                        'May': 'মে', 'June': 'জুন', 'July': 'জুলাই', 'August': 'আগস্ট',
                        'September': 'সেপ্টেম্বর', 'October': 'অক্টোবর', 'November': 'নভেম্বর', 'December': 'ডিসেম্বর'
                    };
                    return `${day} ${months[month] || month} কাটা হয়েছে`;
                } else if (languageCode === 'te') {
                    return `${day} ${month} న కోసిన`;
                } else if (languageCode === 'mr') {
                    const months = {
                        'January': 'जानेवारी', 'February': 'फेब्रुवारी', 'March': 'मार्च', 'April': 'एप्रिल',
                        'May': 'मे', 'June': 'जून', 'July': 'जुलै', 'August': 'ऑगस्ट',
                        'September': 'सप्टेंबर', 'October': 'ऑक्टोबर', 'November': 'नोव्हेंबर', 'December': 'डिसेंबर'
                    };
                    return `${this.convertNumberToMarathi(day)} ${months[month] || month} ला कापणी केली`;
                } else if (languageCode === 'ta') {
                    return `${day} ${month} அறுவடை செய்யப்பட்டது`;
                } else if (languageCode === 'gu') {
                    return `${day} ${month} કાપવામાં આવ્યું`;
                } else if (languageCode === 'kn') {
                    return `${day} ${month} ಕೊಯ್ಲು ಮಾಡಲಾಗಿದೆ`;
                } else if (languageCode === 'ml') {
                    return `${day} ${month} വിളവെടുത്തത്`;
                } else if (languageCode === 'pa') {
                    return `${day} ${month} ਵਾਢੀ ਕੀਤੀ`;
                } else if (languageCode === 'or') {
                    return `${day} ${month} ଅମଳ କରାଯାଇଛି`;
                } else if (languageCode === 'as') {
                    return `${day} ${month} চপোৱা হৈছে`;
                } else if (languageCode === 'ur') {
                    return `${day} ${month} فصل کاٹی گئی`;
                }
                return `harvested on ${this.convertNumberToWords(day)} ${month}`;
            })
            .replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, (match, day, month, year) => {
                if (languageCode === 'hi') {
                    const months = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
                        'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
                    return `${this.convertNumberToHindi(day)} ${months[parseInt(month) - 1]}`;
                } else if (languageCode === 'bn') {
                    const months = ['জানুয়ারী', 'ফেব্রুয়ারী', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
                        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
                    return `${day} ${months[parseInt(month) - 1]}`;
                }
                return `${this.convertNumberToWords(day)} ${this.getMonthName(month)}`;
            })

            // Clean up structural elements
            .replace(/:\s*\n/g, ': ')
            .replace(/\n+/g, '. ')
            .replace(/\s*:\s*/g, ': ')
            .replace(/\s*-\s*/g, ' ')

            // Remove excessive punctuation and clean up
            .replace(/\.{2,}/g, '.')
            .replace(/\s+/g, ' ')
            .trim();

        return processedText;
    }

    // Helper function to convert numbers to Hindi words
    convertNumberToHindi(num) {
        const ones = ['', 'एक', 'दो', 'तीन', 'चार', 'पांच', 'छह', 'सात', 'आठ', 'नौ'];
        const teens = ['दस', 'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस'];
        const tens = ['', '', 'बीस', 'तीस', 'चालीस', 'पचास', 'साठ', 'सत्तर', 'अस्सी', 'नब्बे'];
        const hundreds = ['', 'एक सौ', 'दो सौ', 'तीन सौ', 'चार सौ', 'पांच सौ', 'छह सौ', 'सात सौ', 'आठ सौ', 'नौ सौ'];

        const n = parseInt(num);
        if (n === 0) return 'शून्य';
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return hundreds[Math.floor(n / 100)] + (n % 100 ? ' ' + this.convertNumberToHindi(n % 100) : '');
        if (n < 100000) {
            const thousands = Math.floor(n / 1000);
            const remainder = n % 1000;
            return this.convertNumberToHindi(thousands) + ' हजार' + (remainder ? ' ' + this.convertNumberToHindi(remainder) : '');
        }
        if (n < 10000000) {
            const lakhs = Math.floor(n / 100000);
            const remainder = n % 100000;
            return this.convertNumberToHindi(lakhs) + ' लाख' + (remainder ? ' ' + this.convertNumberToHindi(remainder) : '');
        }
        return num.toString(); // Fallback for very large numbers
    }

    // Helper function to convert numbers to Marathi words
    convertNumberToMarathi(num) {
        const ones = ['', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा', 'सात', 'आठ', 'नऊ'];
        const teens = ['दहा', 'अकरा', 'बारा', 'तेरा', 'चौदा', 'पंधरा', 'सोळा', 'सत्रा', 'अठरा', 'एकोणीस'];
        const tens = ['', '', 'वीस', 'तीस', 'चाळीस', 'पन्नास', 'साठ', 'सत्तर', 'ऐंशी', 'नव्वद'];

        const n = parseInt(num);
        if (n === 0) return 'शून्य';
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        return num.toString(); // Simplified for larger numbers
    }

    // Helper function to convert numbers to Bengali words
    convertNumberToBengali(num) {
        const ones = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
        const teens = ['দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ'];
        const tens = ['', '', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];

        const n = parseInt(num);
        if (n === 0) return 'শূন্য';
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        return num.toString(); // Simplified for larger numbers
    }

    // Helper function to convert numbers to English words
    convertNumberToWords(num) {
        const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
        const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

        const n = parseInt(num);
        if (n === 0) return 'zero';
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + this.convertNumberToWords(n % 100) : '');
        if (n < 100000) {
            const thousands = Math.floor(n / 1000);
            const remainder = n % 1000;
            return this.convertNumberToWords(thousands) + ' thousand' + (remainder ? ' ' + this.convertNumberToWords(remainder) : '');
        }
        if (n < 100000000) {
            const millions = Math.floor(n / 1000000);
            const remainder = n % 1000000;
            return this.convertNumberToWords(millions) + ' million' + (remainder ? ' ' + this.convertNumberToWords(remainder) : '');
        }
        return num.toString(); // Fallback for very large numbers
    }

    // Helper function to get month name
    getMonthName(monthNum) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return months[parseInt(monthNum) - 1] || 'month';
    }

    // Helper function to get month name in Hindi
    getMonthInHindi(monthName) {
        const monthMap = {
            'january': 'जनवरी',
            'february': 'फरवरी',
            'march': 'मार्च',
            'april': 'अप्रैल',
            'may': 'मई',
            'june': 'जून',
            'july': 'जुलाई',
            'august': 'अगस्त',
            'september': 'सितंबर',
            'october': 'अक्टूबर',
            'november': 'नवंबर',
            'december': 'दिसंबर'
        };
        return monthMap[monthName.toLowerCase()] || monthName;
    }

    // Enhanced speak method with smart text processing
    async speakSmart(text, languageCode = 'en', options = {}) {
        try {
            // Generate smart, human-like speech text first
            const smartText = await this.generateSmartSpeechText(text, languageCode);

            // Only start speaking once we have the smart text ready
            return await this.speak(smartText, languageCode, options);
        } catch (error) {
            // Fallback to regular speech with basic preprocessing
            const processedText = this.preprocessTextForSpeech(text, languageCode);
            return await this.speak(processedText, languageCode, options);
        }
    }

    // Enhanced speak method that returns both processed text and speech promise
    async speakSmartWithText(text, languageCode = 'en', options = {}) {
        try {
            // Generate smart, human-like speech text first
            const smartText = await this.generateSmartSpeechText(text, languageCode);

            // Return both the processed text and the speech promise
            return {
                processedText: smartText,
                speakPromise: this.speak(smartText, languageCode, options)
            };
        } catch (error) {
            // Fallback to regular speech with basic preprocessing
            const processedText = this.preprocessTextForSpeech(text, languageCode);
            return {
                processedText: processedText,
                speakPromise: this.speak(processedText, languageCode, options)
            };
        }
    }
}

// Create a singleton instance
const ttsService = new TextToSpeechService();

export default ttsService;
