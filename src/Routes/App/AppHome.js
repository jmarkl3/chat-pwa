import React, { useState, useRef, useEffect } from 'react'
import './AppHome.css'
import Settings from './Settings'
import Menu from './Menu'
import TextInput from './TextInput'
import Message from './Message'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import SlidePanel from './SlidePanel';
import ChatHistory from './ChatHistory';

const STORAGE_KEY = 'chat-app-settings';
const CHATS_STORAGE_KEY = 'chat-app-chats';
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
  const [showHistory, setShowHistory] = useState(false);
  const [longTermMemory, setLongTermMemory] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chats, setChats] = useState({});
  const [saveHistoryEnabled, setSaveHistoryEnabled] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [autoSendEnabled, setAutoSendEnabled] = useState(false);
  const [autoSendTimeout, setAutoSendTimeout] = useState(5);
  const [settingsPromptPreface, setSettingsPromptPreface] = useState(PROMPT_PREFACE);
  const [initialLongTermMemory, setInitialLongTermMemory] = useState('');
  const [previousMessagesCount, setPreviousMessagesCount] = useState(10);
  const [voices, setVoices] = useState([]);
  const [isListening, setIsListening] = useState(false);

  const chatIdRef = useRef(null);
  const lastSpokenTextRef = useRef('');
  const shortTermMemoryRef = useRef('');
  const inputRef = useRef(null);
  const autoSendTimerRef = useRef(null);
  const messagesEndRef = useRef(null);

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

      // Load saved settings
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        // Only set the voice if it exists in available voices
        if (settings.selectedVoice && availableVoices.some(v => v.name === settings.selectedVoice)) {
          setSelectedVoice(settings.selectedVoice);
        } else if (availableVoices.length > 0) {
          // If saved voice not found, use first available voice
          setSelectedVoice(availableVoices[0].name);
        }
      } else if (availableVoices.length > 0 && !selectedVoice) {
        // If no saved settings, use first available voice
        setSelectedVoice(availableVoices[0].name);
      }
    };

    // Try to load voices immediately
    loadVoices();

    // Also set up event listener for when voices are loaded asynchronously
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Load settings from localStorage
  const loadInitialSettings = () => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        return {
          ttsEnabled: settings.ttsEnabled ?? false,
          autoSendEnabled: settings.autoSendEnabled ?? false,
          autoSendTimeout: settings.autoSendTimeout ?? 5,
          promptPreface: settings.promptPreface ?? PROMPT_PREFACE,
          longTermMemory: settings.longTermMemory ?? '',
          previousMessagesCount: settings.previousMessagesCount ?? 10,
          saveHistoryEnabled: settings.saveHistoryEnabled ?? true
        };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    return { 
      ttsEnabled: false, 
      autoSendEnabled: false,
      autoSendTimeout: 5,
      promptPreface: PROMPT_PREFACE,
      longTermMemory: '',
      previousMessagesCount: 10,
      saveHistoryEnabled: true
    };
  };

  // Load settings from localStorage
  useEffect(() => {
    const settings = loadInitialSettings();
    setTtsEnabled(settings.ttsEnabled);
    setAutoSendEnabled(settings.autoSendEnabled);
    setAutoSendTimeout(settings.autoSendTimeout);
    setSettingsPromptPreface(settings.promptPreface);
    setLongTermMemory(settings.longTermMemory || '');
    setPreviousMessagesCount(settings.previousMessagesCount);
    setSaveHistoryEnabled(settings.saveHistoryEnabled);

    // Load chats from localStorage
    const savedChats = localStorage.getItem(CHATS_STORAGE_KEY);
    if (savedChats) {
      setChats(JSON.parse(savedChats));
    }
  }, []);

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
          lastSpokenTextRef.current = '';
        };

        utterance.onerror = (event) => {
          console.log('Speech error:', event);
          setIsSpeaking(false);
          setIsPaused(false);
          // Clear the last spoken text so it can be retried
          lastSpokenTextRef.current = '';
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

  const speakFromMessage = (startIndex) => {
    if (ttsEnabled && selectedVoice) {
      // If there's no valid startIndex or we don't know where we left off, start from beginning
      if (startIndex === undefined || startIndex < 0 || startIndex >= messages.length) {
        startIndex = 0;
      }

      window.speechSynthesis.cancel();
      setIsSpeaking(true);
      setIsPaused(false);

      const messagesToSpeak = messages.slice(startIndex);
      const speakNext = (index) => {
        if (index < messagesToSpeak.length) {
          const message = messagesToSpeak[index];
          // Only speak assistant messages
          if (message.role === 'assistant') {
            const utterance = new SpeechSynthesisUtterance(message.content);
            const voice = voices.find(v => v.name === selectedVoice);
            if (voice) {
              utterance.voice = voice;
              utterance.onend = () => speakNext(index + 1);
              utterance.onerror = (event) => {
                console.log('Speech error:', event);
                // On error, try the next message
                speakNext(index + 1);
              };
              window.speechSynthesis.speak(utterance);
            } else {
              // If voice not found, try next message
              speakNext(index + 1);
            }
          } else {
            // If not assistant message, skip to next
            speakNext(index + 1);
          }
        } else {
          setIsSpeaking(false);
          setIsPaused(false);
        }
      };
      speakNext(0);
    }
  };

  const addToShortTermMemory = (message) => {
    shortTermMemoryRef.current += message + "\n";
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
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
      
      // Set new timer - use default of 5 seconds if autoSendTimeout is empty
      const timeoutSeconds = autoSendTimeout === '' ? 5 : autoSendTimeout;
      autoSendTimerRef.current = setTimeout(() => {
        if (inputRef.current.value.trim()) {
          handleSubmit();
        }
      }, timeoutSeconds * 1000);
    }
  };

  const handleCommand = (command, args) => {
    switch (command.toLowerCase()) {
      case 'replay':
        // Get number of messages to replay (default to 1 if not specified)
        const count = args.length > 0 ? parseInt(args[0]) : 1;
        
        // Validate count is a number and within reasonable range
        if (isNaN(count) || count < 1 || count > 10) {
          console.log('Invalid replay count. Please use a number between 1 and 10');
          return;
        }

        // Get the last N assistant messages in chronological order
        const assistantMessages = [...messages]
          .reverse() // Reverse to get newest first
          .filter(msg => msg.role === 'assistant')
          .slice(0, count) // Get the N most recent messages
          .reverse(); // Reverse again to get oldest first

        if (assistantMessages.length > 0) {
          // Cancel any ongoing speech
          window.speechSynthesis.cancel();
          
          // Create a function to speak messages sequentially
          const speakMessages = (index = 0) => {
            if (index < assistantMessages.length) {
              const utterance = new SpeechSynthesisUtterance(assistantMessages[index].content);
              const voice = voices.find(v => v.name === selectedVoice);
              if (voice) {
                utterance.voice = voice;
                // When this message ends, speak the next one
                utterance.onend = () => speakMessages(index + 1);
                window.speechSynthesis.speak(utterance);
              }
            }
          };

          // Start speaking messages
          speakMessages();
        }
        break;
      // Add more commands here in the future
      default:
        console.log('Unknown command:', command);
    }
  };

  const processInput = (input) => {
    const words = input.trim().split(/\s+/);
    let firstWord = words[0].toLowerCase()
    if (words.length >= 2 && (firstWord === 'command' || firstWord === 'commands')) {
      const command = words[1];
      const args = words.slice(2);
      handleCommand(command, args);
      return false; // Don't send to API
    }
    return true; // Send to API
  };

  const handleSubmit = async () => {
    // Clear any existing auto-send timer
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }

    const userInput = inputRef.current.value.trim();
    if (!userInput) return;

    // Clear input immediately
    inputRef.current.value = '';

    // Process input and only send to API if it's not a command
    if (processInput(userInput)) {
      await handleSendMessage(userInput);
    }
  };

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    if (!chatIdRef.current && saveHistoryEnabled) {
      chatIdRef.current = Math.floor(Math.random() * 1000000).toString();
      const newChat = {
        messages: [],
        timestamp: Date.now()
      };
      setChats(prev => ({
        ...prev,
        [chatIdRef.current]: newChat
      }));
    }

    const userMessage = {
      role: 'user',
      content: message
    };

    // Add user message and scroll
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    scrollToBottom();

    try {
      const url = 'https://api.deepseek.com/chat/completions';
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${"sk-6e0ec3f3dc5e42e6b259179411dd2f06"}`,
      };
      const body = JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: settingsPromptPreface},
          { role: 'system', content: "Memory from previous: " + longTermMemory},
          ...messages.slice(-previousMessagesCount),
          userMessage
        ],
        stream: false,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.choices[0].message.content
      };

      // Add assistant message and scroll
      setMessages(prev => [...prev, assistantMessage]);
      scrollToBottom();

      // Speak the response if TTS is enabled
      speakText(assistantMessage.content);

      // Update chat history if enabled
      if (saveHistoryEnabled && chatIdRef.current) {
        const updatedChat = {
          messages: [...messages, userMessage, assistantMessage],
          timestamp: Date.now()
        };
        
        setChats(prev => {
          const updated = {
            ...prev,
            [chatIdRef.current]: updatedChat
          };
          localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.'
      };
      setMessages(prev => [...prev, errorMessage]);
      speakText(errorMessage.content);
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

  const handleLongTermMemoryChange = (e) => {
    const newValue = e.target.value;
    setLongTermMemory(newValue);
    const settings = {
      ttsEnabled,
      selectedVoice,
      autoSendEnabled,
      promptPreface: settingsPromptPreface,
      longTermMemory: newValue,
      previousMessagesCount,
      saveHistoryEnabled
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  };

  const loadChat = (chatId) => {
    const chat = chats[chatId];
    if (chat) {
      setMessages(chat.messages);
      chatIdRef.current = chatId;
    }
  };

  const saveCurrentChat = () => {
    if (!chatIdRef.current || messages.length === 0 || !saveHistoryEnabled) return;
    
    const updatedChats = {
      ...chats,
      [chatIdRef.current]: {
        messages: messages,
        timestamp: Date.now()
      }
    };
    setChats(updatedChats);
    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updatedChats));
  };

  useEffect(() => {
    if (chatIdRef.current) {
      saveCurrentChat();
    }
  }, [messages]);

  const handleNewChat = () => {
    setMessages([]);
    chatIdRef.current = null;
    setShowMenu(false);
  };

  return (
    <div className="app-container">
      <button className="hamburger-button" onClick={() => setShowMenu(!showMenu)}>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>
      <Menu 
        isOpen={showMenu} 
        setIsOpen={setShowMenu}
        setShowSettings={setShowSettings}
        setShowHistory={setShowHistory}
        setShowLongTermMemory={setShowLongTermMemory}
      />
      <div className="messages-container" ref={messagesEndRef}>
        {messages.map((message, index) => (
          <Message
            key={index}
            message={message.content}
            type={message.role}
            selectedVoice={selectedVoice}
            voices={voices}
            onSpeakFromHere={() => speakFromMessage(index)}
            onAddToShortTermMemory={addToShortTermMemory}
          />
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="loading-dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </div>
          </div>
        )}
      </div>
      <div className="input-container">
        <textarea
          ref={inputRef}
          placeholder="Type your message..."
          onKeyDown={handleKeyPress}
          onChange={handleInputChange}
          // onInput={handleInputChange}
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
        previousMessagesCount={previousMessagesCount}
        setPreviousMessagesCount={setPreviousMessagesCount}
        setShowLongTermMemory={setShowLongTermMemory}
        saveHistoryEnabled={saveHistoryEnabled}
        setSaveHistoryEnabled={setSaveHistoryEnabled}
        autoSendTimeout={autoSendTimeout}
        setAutoSendTimeout={setAutoSendTimeout}
      />
      <ChatHistory
        isOpen={showHistory}
        setIsOpen={setShowHistory}
        chats={chats}
        onSelectChat={loadChat}
        currentChatId={chatIdRef.current}
        onNewChat={handleNewChat}
      />
      {showLongTermMemory && (
        <div className="overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Long Term Memory</h2>
              <button onClick={() => setShowLongTermMemory(false)}>&times;</button>
            </div>
            <div className="prompt-editor">
              <textarea
                value={longTermMemory}
                onChange={handleLongTermMemoryChange}
                rows="20"
              />
            </div>
          </div>
        </div>
      )}
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
    </div>
  )
}

export default AppHome