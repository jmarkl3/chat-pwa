import React, { useState, useRef, useEffect } from 'react'
import './AppHome.css'
import Settings from './Settings'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const STORAGE_KEY = 'chat-app-settings';

function AppHome() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Load settings from localStorage
  const loadInitialSettings = () => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        return {
          ttsEnabled: settings.ttsEnabled ?? false,
          selectedVoice: settings.selectedVoice || '',
          autoSendEnabled: settings.autoSendEnabled ?? false
        };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    return { ttsEnabled: false, selectedVoice: '', autoSendEnabled: false };
  };

  const initialSettings = loadInitialSettings();
  const [ttsEnabled, setTtsEnabled] = useState(initialSettings.ttsEnabled);
  const [selectedVoice, setSelectedVoice] = useState(initialSettings.selectedVoice);
  const [autoSendEnabled, setAutoSendEnabled] = useState(initialSettings.autoSendEnabled);
  
  const [voices, setVoices] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const autoSendTimerRef = useRef(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    // Get available voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(availableVoices[0].name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoice]);

  // Update input value when transcript changes
  useEffect(() => {
    if (transcript && inputRef.current) {
      inputRef.current.value = transcript;
    }
  }, [transcript]);

  // Update isListening state when listening changes
  useEffect(() => {
    setIsListening(listening);
  }, [listening]);

  const speakText = (text) => {
    if (ttsEnabled && selectedVoice) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) {
        utterance.voice = voice;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = () => {
    if (autoSendEnabled && inputRef.current.value.trim()) {
      // Clear any existing timer
      if (autoSendTimerRef.current) {
        clearTimeout(autoSendTimerRef.current);
      }
      
      // Set new timer
      autoSendTimerRef.current = setTimeout(() => {
        if (inputRef.current.value.trim()) {
          handleSubmit();
        }
      }, 5000);
    }
  };

  const handleSubmit = async () => {
    // Clear any existing auto-send timer
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }

    const userInput = inputRef.current.value.trim();
    if (!userInput) return;

    // Add user message
    const newMessage = { role: 'user', content: userInput };
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);
    inputRef.current.value = '';

    // Get previous messages (last 4) plus the new message
    const recentMessages = [...messages.slice(-4), newMessage];

    // Fetch variables
    const url = 'https://api.deepseek.com/chat/completions';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${"sk-6e0ec3f3dc5e42e6b259179411dd2f06"}`,
    };
    const body = JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        ...recentMessages
      ],
      stream: false,
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
      });
      
      const data = await response.json();
      const responseMessage = { role: 'assistant', content: data.choices[0].message.content };
      setMessages(prev => [...prev, responseMessage]);
      speakText(responseMessage.content);
    } catch (error) {
      const errorMessage = { role: 'assistant', content: 'Sorry, there was an error processing your request.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const toggleVoiceInput = async () => {
    if (!browserSupportsSpeechRecognition) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    try {
      // Request microphone permissions
      await navigator.mediaDevices.getUserMedia({ audio: true });

      if (isListening) {
        SpeechRecognition.stopListening();
      } else {
        resetTranscript();
        await SpeechRecognition.startListening({ continuous: true });
      }
    } catch (error) {
      alert("Microphone permission required to record voice");
    }
  };

  return (
    <div className="chat-container">
      <button className="settings-button" onClick={toggleSettings}>
        <span title={"Settings"} style={{ fontSize: '26px' }}>⚙️</span>
      </button>

      <Settings
        ttsEnabled={ttsEnabled}
        setTtsEnabled={setTtsEnabled}
        voices={voices}
        selectedVoice={selectedVoice}
        setSelectedVoice={setSelectedVoice}
        autoSendEnabled={autoSendEnabled}
        setAutoSendEnabled={setAutoSendEnabled}
        showSettings={showSettings}
      />

      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            {message.content}
          </div>
        ))}
        {isLoading && (
          <div className="message assistant loading">
            <div className="loading-dots">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-container">
        <textarea 
          ref={inputRef}
          placeholder="Type your message..."
          onKeyDown={handleKeyPress}
          onChange={handleInputChange}
        />
        <div className="button-container">
          <button 
            className={`voice-input-button ${isListening ? 'listening' : ''}`} 
            onClick={toggleVoiceInput}
            title={isListening ? 'Stop voice input' : 'Start voice input'}
          >
            {isListening ? '🎤' : '🎤'}
          </button>
          <button className="submit-button" onClick={handleSubmit}>Send</button>
        </div>
      </div>
    </div>
  )
}

export default AppHome