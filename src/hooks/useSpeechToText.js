import { useCallback, useEffect, useRef, useState } from 'react';

const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

/**
 * Browser speech-to-text via the Web Speech API.
 * Transcript is appended into the controlled input via onTranscript.
 */
const useSpeechToText = ({ onTranscript, disabled = false } = {}) => {
  const recognitionRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [isSupported] = useState(() => Boolean(getSpeechRecognition()));

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.stop();
    } catch {
      // ignore stop errors when already stopped
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (disabled) return;

    const SpeechRecognitionCtor = getSpeechRecognition();
    if (!SpeechRecognitionCtor) {
      setError('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    setError(null);

    // Restart cleanly if already listening
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result?.[0]?.transcript || '';
        if (result.isFinal) {
          finalText += text;
        } else {
          interim += text;
        }
      }

      const transcript = (finalText || interim).trim();
      if (transcript && onTranscriptRef.current) {
        onTranscriptRef.current(transcript, { isFinal: Boolean(finalText) });
      }
    };

    recognition.onerror = (event) => {
      const code = event?.error;
      if (code === 'aborted' || code === 'no-speech') {
        setIsListening(false);
        return;
      }
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        setError('Microphone permission denied. Allow mic access to talk to LIO.');
      } else if (code === 'network') {
        setError('Network error while listening. Check your connection and try again.');
      } else {
        setError('Could not start voice input. Please try again.');
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setError('Could not start voice input. Please try again.');
      setIsListening(false);
    }
  }, [disabled]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    if (disabled && isListening) {
      stopListening();
    }
  }, [disabled, isListening, stopListening]);

  useEffect(() => () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  return {
    isSupported,
    isListening,
    error,
    clearError: () => setError(null),
    startListening,
    stopListening,
    toggleListening,
  };
};

export default useSpeechToText;
