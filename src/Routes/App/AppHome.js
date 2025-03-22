import React, { useState, useRef, useEffect } from 'react'
import './AppHome.css'
import Settings from './Settings'

const STORAGE_KEY = 'chat-app-settings';

function AppHome() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        const { ttsEnabled } = JSON.parse(savedSettings);
        console.log('Loading TTS enabled:', ttsEnabled);
        return ttsEnabled;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    return false;
  });
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        const { selectedVoice } = JSON.parse(savedSettings);
        return selectedVoice || '';
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    return '';
  });
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Get available voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0) {
        // If no voice is selected or selected voice isn't available, set default
        if (!selectedVoice || !availableVoices.some(v => v.name === selectedVoice)) {
          setSelectedVoice(availableVoices[0].name);
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoice]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        
        if (event.results[0].isFinal) {
          inputRef.current.value = transcript;
        }
      };


      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const speakText = (text) => {
    if (ttsEnabled && selectedVoice) {
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

  async function sendPrompt() {
    const prompt = inputRef.current.value;
    if (!prompt.trim()) return;

    // Add user message
    const newMessage = { role: 'user', content: prompt };
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
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
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
          onKeyPress={handleKeyPress}
        />
        <div className="button-container">
          <button 
            className={`voice-input-button ${isListening ? 'listening' : ''}`} 
            onClick={toggleVoiceInput}
            title={isListening ? 'Stop voice input' : 'Start voice input'}
          >
            {isListening ? '🎤' : '🎤'}
          </button>
          <button className="submit-button" onClick={sendPrompt}>Send</button>
        </div>
      </div>
    </div>
  )
}

export default AppHome