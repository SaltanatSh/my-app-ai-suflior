import { useState, useEffect, useRef, useCallback } from 'react';

// Define the types for the Web Speech API
interface IWindow extends Window {
  SpeechRecognition?: typeof SpeechRecognition;
  webkitSpeechRecognition?: typeof SpeechRecognition;
}

interface SpeechRecognitionState {
  isListening: boolean;
  error: string | null;
  finalTranscript: string;
  interimTranscript: string;
  selectedLanguage: string;
}

export const useSpeechRecognition = (initialLanguage: string = 'ru-RU') => {
  const [state, setState] = useState<SpeechRecognitionState>({
    isListening: false,
    error: null,
    finalTranscript: '',
    interimTranscript: '',
    selectedLanguage: initialLanguage,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    const windowWithSpeech = window as IWindow;
    const SpeechRecognitionAPI = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setState(prev => ({
        ...prev,
        error: 'Ваш браузер не поддерживает распознавание речи. Попробуйте использовать Chrome.'
      }));
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    // Configure recognition
    recognition.lang = state.selectedLanguage;
    recognition.interimResults = true;
    recognition.continuous = true;

    // Handle results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setState(prev => ({
        ...prev,
        finalTranscript: prev.finalTranscript + finalTranscript,
        interimTranscript
      }));
    };

    // Handle errors
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setState(prev => ({
        ...prev,
        error: `Ошибка распознавания: ${event.error}`
      }));
    };

    // Handle end of recognition
    recognition.onend = () => {
      setState(prev => ({
        ...prev,
        isListening: false,
        interimTranscript: ''
      }));
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [state.selectedLanguage]); // Re-initialize when language changes

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      setState(prev => ({
        ...prev,
        isListening: true,
        error: null,
        finalTranscript: '',
        interimTranscript: ''
      }));
      recognitionRef.current.start();
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setState(prev => ({
      ...prev,
      finalTranscript: '',
      interimTranscript: ''
    }));
  }, []);

  const setLanguage = useCallback((language: string) => {
    if (state.isListening) {
      stopListening();
    }
    setState(prev => ({
      ...prev,
      selectedLanguage: language,
      finalTranscript: '',
      interimTranscript: ''
    }));
  }, [state.isListening, stopListening]);

  return {
    ...state,
    startListening,
    stopListening,
    resetTranscript,
    setLanguage
  };
}; 