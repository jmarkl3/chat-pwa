import React, { useState, useRef, useEffect } from 'react'
import './AppHome.css'
import Settings from './Settings'
import Menu from './Menu'
import TextInput from './TextInput'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const STORAGE_KEY = 'chat-app-settings';
const PROMPT_PREFACE = `
    This is a speech based conversation app. Give relatively short answers that would be expected during a spoken conversation.
  
    If the user just says hi or the conversation is not in an interesting place you can ask the user if they want to play one of these games (choose one randomly)
    Lead the conversation to keep the user interested, 
    bring up interesting topics that the user will be interested in 
    and that will make the user feel happy an excited
    but don't say thats what your doing, just do it like a natural conversation between people
    also sometimes ask if they want to play one of the games
 

    A few games that are meant to improve conversational ability and mood:
    reminds of
    connect 2
    3 thigns game
    episodic recall
    random questions
    mood lifter
    like if
    math/logic games

    reminds of
    given a word the user describes what it reminds them of.
    this could be a story or a joke or even just another word.
    the idea though is for the user to think of a few interesting thigns that may be something interesting to say in a conversation.
    if the user can not come up with anythign the llm can give them a few things that people may think are interesting
    
    connect 2
    give the user 2 random nouns (person place thing etc) that may be common in conversations and tell them to think of all the ways they are connected

    3 thigns game
    give the user a word and ask them to come up with the 3 most interesting things it reminds them of
    or just the first 3 things that the word reminds them of
    then ask them to pick one of the things they thought of and choose 3 new ones from tha
    and ask them to remember the links of all of the words with the 3 related for around 5 back 

    episodic recall:
    what have you odne today
    what did you do yesterday    

    random questions:
    ask the user a thought provoking questions

    mood booster:
    ask the user to go to a moment in their past that will lift their mood and make them feel happy and affluent like a winner 
    ex:
    go to a time you felt like you were winning
    or won, 
    or felt close to somebody, 
    or everyone agreed with you, 
    or you created something beautiful, 
    or you helped someone,
    tried something you wereent sure about or took a risk and it worked out well 
    or you recieved recognition for doing something well

    like if
    the purpose of this game is to get the user to start thinking and feeling like they are a winner with a tono of money and siccess 
    ask them user what would a person who always wins do in thie situation
    or what would it be like if you were a winner or could do whatever you want or had infinite money etc

    math/logic games
    ask the user to solve basic math problems in their head like multiplication or multiplication etc
    also ask them riddles and logic word puzzles
  `;

function AppHome() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showLongTermMemory, setShowLongTermMemory] = useState(false);
  const [showPromptPreface, setShowPromptPreface] = useState(false);
  const [longTermMemory, setLongTermMemory] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastSpokenTextRef = useRef('');
  
  // Load settings from localStorage
  const loadInitialSettings = () => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        return {
          ttsEnabled: settings.ttsEnabled ?? false,
          selectedVoice: settings.selectedVoice || '',
          autoSendEnabled: settings.autoSendEnabled ?? false,
          promptPreface: settings.promptPreface ?? PROMPT_PREFACE,
          longTermMemory: settings.longTermMemory ?? ''
        };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    return { 
      ttsEnabled: false, 
      selectedVoice: '', 
      autoSendEnabled: false,
      promptPreface: PROMPT_PREFACE,
      longTermMemory: ''
    };
  };

  const initialSettings = loadInitialSettings();
  const [ttsEnabled, setTtsEnabled] = useState(initialSettings.ttsEnabled);
  const [selectedVoice, setSelectedVoice] = useState(initialSettings.selectedVoice);
  const [autoSendEnabled, setAutoSendEnabled] = useState(initialSettings.autoSendEnabled);
  const [settingsPromptPreface, setSettingsPromptPreface] = useState(initialSettings.promptPreface);
  const [initialLongTermMemory, setInitialLongTermMemory] = useState(initialSettings.longTermMemory);
  
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
      setIsSpeaking(true);
      setIsPaused(false);
      lastSpokenTextRef.current = text;

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) {
        utterance.voice = voice;
        
        utterance.onend = () => {
          console.log('Speech ended');
          setIsSpeaking(false);
          setIsPaused(false);
        };

        utterance.onpause = () => {
          console.log('Speech paused');
          setIsPaused(true);
        };

        utterance.onresume = () => {
          console.log('Speech resumed');
          setIsPaused(false);
        };

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
        { role: 'system', content: settingsPromptPreface},
        { role: 'system', content: "Memory from previous: " + initialLongTermMemory},
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

  const togglePause = () => {
    const currentState = { speaking: isSpeaking, paused: isPaused };
    console.log('Current state:', currentState);

    if (isSpeaking) {
      if (isPaused) {
        // Currently paused, should resume
        console.log('Action: Resume speech');
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        // Currently speaking, should pause
        console.log('Action: Pause speech');
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    } else if (lastSpokenTextRef.current) {
      // Not speaking, should start new speech
      console.log('Action: Replay last speech');
      speakText(lastSpokenTextRef.current);
    }

    // Log state after change
    // setTimeout(() => {
    //   const newState = { speaking: isSpeaking, paused: isPaused };
    //   console.log('New state:', newState);
    // }, 100);
  };

  return (
    <div className="app-container">
      {/* <button className="settings-button" onClick={() => setShowSettings(!showSettings)}>⚙️</button> */}
      <button className="hamburger-button" onClick={() => setShowMenu(!showMenu)}>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
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
        setShowSettings={setShowSettings}
        setShowPromptPreface={setShowPromptPreface}
      />
      <Menu 
        isOpen={showMenu} 
        setIsOpen={setShowMenu} 
        setShowSettings={setShowSettings}
        setShowLongTermMemory={setShowLongTermMemory}
      />
      <TextInput
        title="Long Term Memory"
        isOpen={showLongTermMemory}
        setIsOpen={setShowLongTermMemory}
        defaultValue={initialLongTermMemory}
        onChange={(value) => {
          setInitialLongTermMemory(value);
          const settings = {
            ttsEnabled,
            selectedVoice,
            autoSendEnabled,
            promptPreface: settingsPromptPreface,
            longTermMemory: value
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        }}
      />
      <TextInput
        title="Prompt Preface"
        isOpen={showPromptPreface}
        setIsOpen={setShowPromptPreface}
        defaultValue={settingsPromptPreface}
        onChange={(value) => {
          setSettingsPromptPreface(value);
          const settings = {
            ttsEnabled,
            selectedVoice,
            autoSendEnabled,
            promptPreface: value,
            longTermMemory: initialLongTermMemory
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        }}
        showRestoreDefault={true}
        onRestoreDefault={() => {
          setSettingsPromptPreface(PROMPT_PREFACE);
          const settings = {
            ttsEnabled,
            selectedVoice,
            autoSendEnabled,
            promptPreface: PROMPT_PREFACE,
            longTermMemory: initialLongTermMemory
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        }}
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
          <div className="left-buttons">
            <button
              className={`voice-input-button ${isListening ? 'listening' : ''}`}
              onClick={toggleVoiceInput}
            >
              🎤
            </button>
            <button
              className={`pause-button ${isSpeaking ? (isPaused ? 'paused' : 'speaking') : ''}`}
              onClick={togglePause}
              disabled={!lastSpokenTextRef.current && !isSpeaking}
              title={isSpeaking ? (isPaused ? 'Resume speech' : 'Pause speech') : 'Replay last speech'}
            >
              {isSpeaking ? (isPaused ? '▶️' : '⏸️') : '▶️'}
            </button>
          </div>
          <button className="submit-button" onClick={handleSubmit}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default AppHome