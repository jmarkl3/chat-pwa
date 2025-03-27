import React, { useState, useRef, useEffect } from 'react'
import './AppHome.css'
import Menu from './Menu'
import Message from './Message'
import { STORAGE_KEY, CHATS_STORAGE_KEY, INACTIVITY_MESSAGE, AVAILABLE_COMMANDS, FORMAT_PREFACE, PROMPT_PREFACE } from './Data'

function AppHome() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [longTermMemory, setLongTermMemory] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chats, setChats] = useState({});
  const [settingsObject, setSettingsObject] = useState({
    ttsEnabled: false,
    selectedVoice: '',
    autoSendEnabled: false,
    autoSendTimeout: 5,
    previousMessagesCount: 10,
    saveHistoryEnabled: true,
    inactivityTimerEnabled: true,
    showSettings: false,
    showPromptPreface: false,
    showLongTermMemory: false
  });
  const [voices, setVoices] = useState([]);

  const chatIdRef = useRef(null);
  const lastSpokenTextRef = useRef('');
  const shortTermMemoryRef = useRef('');
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const inactivityCountRef = useRef(0);
  const hasFirstMessageRef = useRef(false);

  // Loading settings chats and voices
  useEffect(() => {
    loadSettings()
    loadChats()

    // Get available voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        setSettingsObject(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadChats = () => {
    // Load chats from localStorage
    try {
      const savedChats = localStorage.getItem(CHATS_STORAGE_KEY);
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats);
        setChats(parsedChats);
        
        // Find the most recent chat and set it as current
        const sortedChats = Object.entries(parsedChats).sort((a, b) => b[1].timestamp - a[1].timestamp);
        if (sortedChats.length > 0) {
          chatIdRef.current = sortedChats[0][0];
        }
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  // Load settings from localStorage
  useEffect(() => {

  }, []);

  const speakText = async (text, index = 0) => {
    if (!settingsObject.ttsEnabled) return;

    // If already speaking, add to queue
    if (isSpeaking) {
      return;
    }

    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === settingsObject.selectedVoice);
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.log('Speech error:', event);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const speakMessages = (startIndex = 0) => {
    if (!settingsObject.ttsEnabled) return;
    
    // Clear any existing speech
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);

    const messagesToSpeak = messages.slice(startIndex);
    
    const speakNext = (index) => {
      if (index < messagesToSpeak.length) {
        const message = messagesToSpeak[index];
        // Only speak assistant messages
        if (message.role === 'assistant') {
          speakText(message.content, index);
        } else {
          // If not assistant message, skip to next
          speakNext(index + 1);
        }
      } else {
        setIsSpeaking(false);
      }
    };

    speakNext(0);
  };

  const addToShortTermMemory = (message) => {
    shortTermMemoryRef.current += message + "\n";
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  };

  const handleInputChange = () => {
    if (settingsObject.autoSendEnabled && inputRef.current.value.trim()) {
      handleSubmit();
    }
  };

  const wordToNumber = (word) => {
    const numberWords = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'to': 2, 'too': 2, // Common TTS interpretations
      '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
      '6': 6, '7': 7, '8': 8, '9': 9, '10': 10
    };
    return numberWords[word.toLowerCase()] || null;
  };

  const findNumberInArgs = (args) => {
    // Look through all args to find a number
    for (const arg of args) {
      const num = wordToNumber(arg);
      if (num !== null) {
        return num;
      }
    }
    return 1; // Default to 1 if no number found
  };

  const updateSetting = (settingName, value) => {
    // Convert setting name to lowercase 
    const setting = settingName.toLowerCase();
    
    // Convert string "true"/"false" to boolean
    const boolValue = value.toLowerCase();
    const isBool = boolValue === 'true' || boolValue === 'false';
    const parsedValue = isBool ? boolValue === 'true' : value;

    let settingDisplayName = '';

    // Handle different settings - using includes() for more flexible matching
    if (setting.includes('auto send') || setting === 'autosend') {
      setSettingsObject(prevSettings => ({ ...prevSettings, autoSendEnabled: parsedValue }));
      settingDisplayName = 'auto send';
    }
    else if (setting.includes('timeout') || setting.includes('auto send timeout')) {
      const timeoutValue = parseInt(value) || 5;
      setSettingsObject(prevSettings => ({ ...prevSettings, autoSendTimeout: timeoutValue }));
      settingDisplayName = 'auto send timeout';
    }
    else if (setting.includes('previous message') || setting.includes('messages')) {
      const messageCount = parseInt(value) || 10;
      setSettingsObject(prevSettings => ({ ...prevSettings, previousMessagesCount: messageCount }));
      settingDisplayName = 'previous messages';
    }
    else if (setting.includes('text to speech') || setting === 'tts') {
      setSettingsObject(prevSettings => ({ ...prevSettings, ttsEnabled: parsedValue }));
      settingDisplayName = 'text to speech';
    }
    else if (setting.includes('save history') || setting === 'history') {
      setSettingsObject(prevSettings => ({ ...prevSettings, saveHistoryEnabled: parsedValue }));
      settingDisplayName = 'save history';
    }
    else if (setting.includes('inactivity timer')) {
      setSettingsObject(prevSettings => ({ ...prevSettings, inactivityTimerEnabled: parsedValue }));
      settingDisplayName = 'inactivity timer';
    }
    else {
      console.log('Unknown setting:', settingName);
      console.log('Available settings: auto send, timeout, previous messages, text to speech (tts), save history, inactivity timer');
      return false;
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsObject));

    // Announce the update via TTS
    speakText(`${settingDisplayName} updated to ${value}`);
    return true;
  };

  const handleCommand = (command, args) => {
    switch (command.toLowerCase()) {
      case 'replay':
      case 'repeat':
      case 'say':
        // Get number of messages to replay (default to 1 if not specified)
        const count = findNumberInArgs(args);
        
        // Validate count is within reasonable range
        if (count < 1 || count > 10) {
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
          speakMessages(0);
        }
        break;

      case 'setting':
      case 'settings':
      case 'update':
        if (args.length < 2) {
          console.log('Usage: command setting <setting name> <value>');
          return;
        }

        // If the command was "update setting", remove the "setting" word
        if (command.toLowerCase() === 'update' && args[0].toLowerCase() === 'setting') {
          args.shift();
        }

        // The last word is the value, everything else is the setting name
        const value = args[args.length - 1];
        const settingName = args.slice(0, -1).join(' ');

        if (updateSetting(settingName, value)) {
          console.log(`Updated ${settingName} to ${value}`);
        }
        break;

      case 'list':
        if (args[0]?.toLowerCase() === 'commands') {
          console.log(AVAILABLE_COMMANDS);
          // Create a more speech-friendly version of the commands list
          const speechCommands = AVAILABLE_COMMANDS
            .split('\n')
            .map(line => line.replace(/^\d+\.\s*/, ''))  // Remove numbering
            .join('. ');  // Add pauses between commands
          speakText(speechCommands);
        }
        break;

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

    // Mark that first message has been sent
    hasFirstMessageRef.current = true;

    // Reset inactivity timer and count when user sends a message
    inactivityCountRef.current = 0;
    resetInactivityTimer();

    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    // Add user message to messages state
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    scrollToBottom();

    // Create a new chat if we don't have one
    if (!chatIdRef.current) {
      const newChatId = Math.floor(Math.random() * 1000000).toString();
      chatIdRef.current = newChatId;
      console.log('Creating new chat with ID:', newChatId);
      
      setChats(prev => {
        const newChat = {
          messages: [userMessage],
          timestamp: Date.now()
        };
        const updated = {
          ...prev,
          [newChatId]: newChat
        };
        console.log('New chats state:', updated);
        localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } else {
      // Add to existing chat
      console.log('Adding to existing chat:', chatIdRef.current);
      setChats(prev => {
        const currentChat = prev[chatIdRef.current];
        if (!currentChat) {
          console.error('Chat not found:', chatIdRef.current);
          return prev;
        }
        const updatedChat = {
          messages: [...currentChat.messages, userMessage],
          timestamp: Date.now()
        };
        const updated = {
          ...prev,
          [chatIdRef.current]: updatedChat
        };
        localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }

    // Now fetch the response
    await fetchDeepSeek(userMessage);
  }

  const removeSpecialCharacters = (text) => {
    return text.replace(/[\*\-\/]/g, '');
  };

  const processResponse = (text) => {
    const cleanedText = removeSpecialCharacters(text);
    try {
      // Remove any leading/trailing whitespace and any text before/after the JSON
      const jsonMatch = cleanedText.match(/\{[^]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        
        // Process commands if they exist
        if (parsed.commands && Array.isArray(parsed.commands)) {
          parsed.commands.forEach(cmd => {
            if (cmd.command === "add to long term memory" && cmd.variables && cmd.variables.length > 0) {
              const newMemory = cmd.variables[0];
              // Append to existing memory with a newline
              const currentMemory = localStorage.getItem(STORAGE_KEY) ? 
                JSON.parse(localStorage.getItem(STORAGE_KEY)).longTermMemory || '' : '';
              const updatedMemory = currentMemory ? `${currentMemory}\n${newMemory}` : newMemory;
              
              // Update localStorage
              const settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
              settings.longTermMemory = updatedMemory;
              localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
              
              // Update state
              setLongTermMemory(updatedMemory);
            }
            else if (cmd.command === "overwrite long term memory" && cmd.variables && cmd.variables.length > 0) {
              const newMemory = cmd.variables[0];
              
              // Update localStorage
              const settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
              settings.longTermMemory = newMemory;
              localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
              
              // Update state
              setLongTermMemory(newMemory);
            }
            else if (cmd.command === "clear long term memory") {
              // Update localStorage
              const settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
              settings.longTermMemory = '';
              localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
              
              // Update state
              setLongTermMemory('');
            }
          });
        }

        if (parsed && parsed.message) {
          return parsed.message;
        }
      }
    } catch (e) {
      console.log('Response was not valid JSON, using as plain text:', e);
    }
    return cleanedText;
  };

  async function fetchDeepSeek(userMessage) {
    try {
      const now = new Date();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const timeInfo = `Current time: ${now.toLocaleTimeString()}, ${days[now.getDay()]}, ${now.toLocaleDateString()}`;

      const url = 'https://api.deepseek.com/chat/completions';
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${"sk-6e0ec3f3dc5e42e6b259179411dd2f06"}`,
      };
      const body = JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: FORMAT_PREFACE + "\n\n" + PROMPT_PREFACE},
          { role: 'system', content: "Memory from previous: " + longTermMemory},
          { role: 'system', content: timeInfo},
          ...messages.slice(-settingsObject.previousMessagesCount),
          userMessage,
          { role: 'system', content: FORMAT_PREFACE }
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
      const processedContent = processResponse(data.choices[0].message.content);
      const assistantMessage = {
        role: 'assistant',
        content: processedContent,
        timestamp: new Date().toISOString()
      };

      // Add assistant message to messages state
      setMessages(prev => [...prev, assistantMessage]);
      scrollToBottom();

      // Speak the response if TTS is enabled
      speakText(assistantMessage.content);

      // Add assistant message to chat history
      console.log('Adding assistant message to chat:', chatIdRef.current);
      setChats(prev => {
        const currentChat = prev[chatIdRef.current];
        if (!currentChat) {
          console.error('Chat not found:', chatIdRef.current);
          return prev;
        }
        const updatedChat = {
          messages: [...currentChat.messages, assistantMessage],
          timestamp: Date.now()
        };
        const updated = {
          ...prev,
          [chatIdRef.current]: updatedChat
        };
        localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

      // Reset inactivity timer after model responds
      resetInactivityTimer();
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      speakText(errorMessage.content);
      
      // Add error message to chat history
      setChats(prev => {
        const currentChat = prev[chatIdRef.current];
        if (!currentChat) return prev;
        const updatedChat = {
          messages: [...currentChat.messages, errorMessage],
          timestamp: Date.now()
        };
        const updated = {
          ...prev,
          [chatIdRef.current]: updatedChat
        };
        localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }

  const resetInactivityTimer = () => {
    if (!hasFirstMessageRef.current || !settingsObject.inactivityTimerEnabled) return;
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    // Only set new timer if we haven't hit the limit
    if (inactivityCountRef.current < 2) {
      inactivityTimerRef.current = setTimeout(() => {
        const inactivityUserMessage = {
          role: 'user',
          content: INACTIVITY_MESSAGE
        };
        inactivityCountRef.current += 1;
        fetchDeepSeek(inactivityUserMessage);
      }, 5 * 60 * 1000); 
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleSettings = () => {
    setSettingsObject(prevSettings => ({ ...prevSettings, showSettings: !prevSettings.showSettings }));
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
      ttsEnabled: settingsObject.ttsEnabled,
      selectedVoice: settingsObject.selectedVoice,
      autoSendEnabled: settingsObject.autoSendEnabled,
      promptPreface: PROMPT_PREFACE,
      longTermMemory: newValue,
      previousMessagesCount: settingsObject.previousMessagesCount,
      saveHistoryEnabled: settingsObject.saveHistoryEnabled,
      inactivityTimerEnabled: settingsObject.inactivityTimerEnabled
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
    if (!chatIdRef.current || messages.length === 0 || !settingsObject.saveHistoryEnabled) return;
    
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

  // Reset inactivity timer when chat ID changes
  useEffect(() => {
    if (chatIdRef.current) {
      console.log('Chat ID changed, resetting inactivity timer');
      resetInactivityTimer();
    }
  }, [chatIdRef.current]);

  const handleUpdateChat = (chatId, updates) => {
    if (chats[chatId]) {
      const updatedChat = {
        ...chats[chatId],
        ...updates,
        timestamp: Date.now()  // Update timestamp when chat is modified
      };
      const updatedChats = {
        ...chats,
        [chatId]: updatedChat
      };
      setChats(updatedChats);
      if (settingsObject.saveHistoryEnabled) {
        localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updatedChats));
      }
    }
  };

  const handleDeleteChat = (chatId) => {
    const { [chatId]: deletedChat, ...remainingChats } = chats;
    setChats(remainingChats);
    if (settingsObject.saveHistoryEnabled) {
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(remainingChats));
    }
    // If the deleted chat was the current chat, create a new chat
    if (chatId === chatIdRef.current) {
      handleNewChat();
    }
  };

  const handleImportChat = (chatData) => {
    const chatId = Date.now().toString();
    const newChat = {
      ...chatData,
      timestamp: Date.now()
    };
    
    const updatedChats = {
      ...chats,
      [chatId]: newChat
    };
    
    setChats(updatedChats);
    if (settingsObject.saveHistoryEnabled) {
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updatedChats));
    }
    
    // Switch to the imported chat
    chatIdRef.current = chatId;
    setMessages(chatData.messages || []);
  };

  return (
    <div className="app-container">

      <Menu 
        isOpen={showMenu} 
        setIsOpen={(isOpen) => setShowMenu(isOpen)}
        setShowSettings={(showSettings) => setSettingsObject(prevSettings => ({ ...prevSettings, showSettings }))}
        setShowLongTermMemory={(showLongTermMemory) => setSettingsObject(prevSettings => ({ ...prevSettings, showLongTermMemory }))}
        menuChats={chats}
        menuCurrentChatId={chatIdRef.current}
        menuOnSelectChat={loadChat}
        menuOnNewChat={handleNewChat}
        menuOnUpdateChat={handleUpdateChat}
        menuOnDeleteChat={handleDeleteChat}
        menuOnImportChat={handleImportChat}

        settingsObject={settingsObject}
        setSettingsObject={setSettingsObject}
      />
      <div className="messages-container" ref={messagesEndRef}>
        {messages.length === 0 && (
          <div className="welcome-box">
            <p>Send a message or just say hi</p>
            <button 
              className="say-hi-button"
              onClick={() => handleSendMessage("hi")}
            >
              Say hi
            </button>
          </div>
        )}
        {messages.map((message, index) => (
          <Message
            key={index}
            message={message.content}
            type={message.role}
            selectedVoice={settingsObject.selectedVoice}
            voices={voices}
            onSpeakFromHere={() => speakMessages(index)}
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
        />
        <div className="button-container">
          <div className="left-buttons">
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
      

      {settingsObject.showLongTermMemory && (
        <div className="overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Long Term Memory</h2>
              <button onClick={() => setSettingsObject(prevSettings => ({ ...prevSettings, showLongTermMemory: false }))}>&times;</button>
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
    </div>
  )
}

export default AppHome