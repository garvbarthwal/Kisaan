import { useState, useEffect, useRef, useCallback } from 'react';

// Custom hook for enhanced voice input with auto-send functionality
const useVoiceInput = (options = {}) => {
    const {
        language = 'en',
        autoSendOnEnd = false,
        autoSendDelay = 1500, // ms to wait after voice ends before auto-sending
        onResult = () => { },
        onEnd = () => { },
        onError = () => { },
        onStart = () => { },
        continuous = false,
        interimResults = true
    } = options;

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef(null);
    const timeoutRef = useRef(null);
    const autoSendTimeoutRef = useRef(null);
    const finalTranscriptRef = useRef('');

    // Language code mapping for speech recognition
    const getLanguageCode = useCallback((langCode) => {
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
    }, []);

    // Initialize speech recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            setIsSupported(true);

            const recognition = new SpeechRecognition();
            recognition.continuous = continuous;
            recognition.interimResults = interimResults;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                setIsListening(true);
                finalTranscriptRef.current = '';
                setTranscript('');
                setInterimTranscript('');
                onStart();
            };

            recognition.onresult = (event) => {
                let finalText = '';
                let interimText = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcriptResult = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalText += transcriptResult;
                    } else {
                        interimText += transcriptResult;
                    }
                }

                if (finalText) {
                    finalTranscriptRef.current = finalText.trim();
                    setTranscript(finalText.trim());
                    setInterimTranscript('');
                    onResult(finalText.trim(), 'final');

                    // Clear any existing auto-send timeout
                    if (autoSendTimeoutRef.current) {
                        clearTimeout(autoSendTimeoutRef.current);
                    }

                    // Set up auto-send with delay if enabled
                    if (autoSendOnEnd && finalText.trim()) {
                        autoSendTimeoutRef.current = setTimeout(() => {
                            onEnd(finalText.trim(), true); // true indicates auto-send
                        }, autoSendDelay);
                    }
                } else if (interimText) {
                    setInterimTranscript(interimText.trim());
                    onResult(interimText.trim(), 'interim');
                }
            };

            recognition.onend = () => {
                setIsListening(false);
                setInterimTranscript('');

                // If no auto-send or no final transcript, call onEnd normally
                if (!autoSendOnEnd || !finalTranscriptRef.current) {
                    onEnd(finalTranscriptRef.current, false);
                }
            };

            recognition.onerror = (event) => {
                setIsListening(false);
                setInterimTranscript('');
                onError(event.error);

                // Clear any pending auto-send
                if (autoSendTimeoutRef.current) {
                    clearTimeout(autoSendTimeoutRef.current);
                }
            };

            recognitionRef.current = recognition;
        } else {
            setIsSupported(false);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (autoSendTimeoutRef.current) {
                clearTimeout(autoSendTimeoutRef.current);
            }
        };
    }, [language, continuous, interimResults, autoSendOnEnd, autoSendDelay, onResult, onEnd, onError, onStart]);

    // Start listening
    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.lang = getLanguageCode(language);
                recognitionRef.current.start();
                // Clear any pending auto-send when starting new recognition
                if (autoSendTimeoutRef.current) {
                    clearTimeout(autoSendTimeoutRef.current);
                }
            } catch (error) {
                onError(error.message);
            }
        }
    }, [language, isListening, getLanguageCode, onError]);

    // Stop listening
    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            // Clear any pending auto-send
            if (autoSendTimeoutRef.current) {
                clearTimeout(autoSendTimeoutRef.current);
            }
        }
    }, [isListening]);

    // Toggle listening
    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    // Reset transcript
    const resetTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
        finalTranscriptRef.current = '';
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (autoSendTimeoutRef.current) {
            clearTimeout(autoSendTimeoutRef.current);
        }
    }, []);

    // Cancel auto-send
    const cancelAutoSend = useCallback(() => {
        if (autoSendTimeoutRef.current) {
            clearTimeout(autoSendTimeoutRef.current);
            autoSendTimeoutRef.current = null;
        }
    }, []);

    return {
        isListening,
        transcript,
        interimTranscript,
        isSupported,
        startListening,
        stopListening,
        toggleListening,
        resetTranscript,
        cancelAutoSend
    };
};

export default useVoiceInput;
