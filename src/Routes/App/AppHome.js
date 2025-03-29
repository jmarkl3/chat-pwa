import React, { useState, useRef, useEffect } from 'react'
import './AppHome.css'
import Menu from './Menu'
import Message from './Message'
import { STORAGE_KEY, CHATS_STORAGE_KEY, INACTIVITY_MESSAGE, AVAILABLE_COMMANDS, FORMAT_PREFACE, PROMPT_PREFACE, DEFAULT_SETTINGS, LONG_TERM_MEMORY_KEY, NOTE_STORAGE_KEY } from './Data'
import { findNumberInArgs, removeSpecialCharacters } from './functions'
import ChatInputArea from './ChatInputArea'

function AppHome() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // Shows the Menu
  const [showMenu, setShowMenu] = useState(false);
  // This should be loaded from local storaapp.ge, reloaded on change, and sent to the system
  const [longTermMemory, setLongTermMemory] = useState('');
  const [tempMem, setTempMem] = useState(null);
  const [lists, setLists] = useState([]);
  // For the tts
  const [isPaused, setIsPaused] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // The chats for the history, this should be in the history component
  const [chats, setChats] = useState({});
  // Should be loaded form local storage and updated on change with a callback 
  const [settingsObject, setSettingsObject] = useState({...DEFAULT_SETTINGS});
  // Used in the tts
  const [voices, setVoices] = useState([]);

  // For savin the chat or loading new ones
  const chatIdRef = useRef(null);
  // For replay (maybe not needed naymore)
  const lastSpokenTextRef = useRef('');
  // Not in use yet but will be
  const shortTermMemoryRef = useRef('');
  // For the input area so it can be cleared
  const inputRef = useRef(null);
  // For the messages so they can be scrolled to the bottom
  const messagesEndRef = useRef(null);
  // For the inactivity timer so user can be reminded
  const inactivityTimerRef = useRef(null);
  // For the inactivity count so it only reminds twice
  const inactivityCountRef = useRef(0);
  // A flag variable
  const hasFirstMessageRef = useRef(false);

  // #region loading

  // Loading settings chats and voices
  useEffect(() => {
    // Load the settings from local storage
    loadSettings()
    // Load the chats from local storage
    loadChats()
    loadLists();

    // Get available voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      console.log('Available voices:', availableVoices);
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
        setSettingsObject(JSON.parse(savedSettings) || DEFAULT_SETTINGS);
      }
    } catch (error) {
      setSettingsObject(DEFAULT_SETTINGS);
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

  const loadLists = () => {
    const listsStr = localStorage.getItem('note-lists') || '[]';
    const loadedLists = JSON.parse(listsStr);
    loadedLists.sort((a, b) => b.lastModified - a.lastModified);
    setLists(loadedLists);
  };

  // #endregion loading

  // #region tts
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

  // #endregion tts

  // #region sending and recieving

  // When text is being sent
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

  // Checks to see if its a command, if so calls handleCommand
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

  // Adds message to messages and calls function to fetch api
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
          timestamp: Date.now(),
          title: message.slice(0, 30) + (message.length > 30 ? '...' : '') // Set initial title
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
          ...currentChat, // Preserve existing chat data including title
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

  // Sends a message to the API and waits for a response
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
      const listsContext = lists.length > 0 ? 
        `\nAvailable lists: ${lists.map(l => `"${l.content}" (id: ${l.id})`).join(', ')}` : 
        '\nNo lists available yet.';
      const tempMemContext = tempMem ? 
        `\nTemp Mem: ${typeof tempMem === 'string' ? tempMem : JSON.stringify(tempMem)}` : 
        '\nTemp Mem: empty';
      const body = JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: FORMAT_PREFACE + "\n\n" + settingsObject.promptPreface + listsContext + tempMemContext},
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

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
      }, 100);
    }
  };


  // #endregion sending and recieving

  // #region commands (from user and system)

  // User Commands:
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

      case 'note':
        if (args.length > 0) {
          const noteText = args.join(' ');
          const currentNote = localStorage.getItem(NOTE_STORAGE_KEY) || '';
          const updatedNote = currentNote ? `${currentNote}\n\n${noteText}` : noteText;
          localStorage.setItem(NOTE_STORAGE_KEY, updatedNote);
          console.log('Added to note:', noteText);
        }
        break;

      default:
        console.log('Unknown command:', command);
        speakText(`Unknown command: ${command}`);
    }
  };

  // Processes the response from the API
  const processResponse = (text) => {
    const cleanedText = removeSpecialCharacters(text);
    console.log("cleanedText: ", cleanedText)
    try {
      // Remove any leading/trailing whitespace and any text before/after the JSON
      const jsonMatch = cleanedText.match(/\{[^]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        
        // Process commands if they exist
        if (parsed.commands && Array.isArray(parsed.commands)) {
          processAPICommands(parsed.commands)
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

  function processAPICommands(commands){
    commands.forEach(cmd => {
      if (cmd.command === "add to long term memory" && cmd.variables && cmd.variables.length > 0) {
        const newMemory = cmd.variables[0];
        // Append to existing memory with a newline
        const currentMemory = localStorage.getItem(LONG_TERM_MEMORY_KEY) || '';
        const updatedMemory = currentMemory ? `${currentMemory}\n${newMemory}` : newMemory;
        
        // Update localStorage
        localStorage.setItem(LONG_TERM_MEMORY_KEY, updatedMemory);
        
        console.log('Updated long term memory:', updatedMemory);

        // Update state
        setLongTermMemory(updatedMemory);
      }
      else if (cmd.command === "overwrite long term memory" && cmd.variables && cmd.variables.length > 0) {
        const newMemory = cmd.variables[0];
        
        // Update localStorage
        localStorage.setItem(LONG_TERM_MEMORY_KEY, newMemory);
        
        // Update state
        setLongTermMemory(newMemory);
      }
      else if (cmd.command === "clear long term memory") {
        // Update localStorage
        localStorage.setItem(LONG_TERM_MEMORY_KEY, '');
        
        // Update state
        setLongTermMemory('');
      }
      else if (cmd.command === "add to note" && cmd.variables && cmd.variables.length > 0) {
        const newNote = cmd.variables[0];
        // Append to existing note with a newline
        const currentNote = localStorage.getItem(NOTE_STORAGE_KEY) || '';
        const updatedNote = currentNote ? `${currentNote}\n${newNote}` : newNote;
        
        // Update localStorage
        localStorage.setItem(NOTE_STORAGE_KEY, updatedNote);
        
        console.log('Updated note:', updatedNote);
      }
      else if (cmd.command === "create list" && cmd.variables && cmd.variables.length > 0) {
        const listName = cmd.variables[0];
        const newList = {
          id: Math.random().toString(36).substr(2, 9),
          content: listName,
          isOpen: true,
          nested: []
        };
        
        // Save the list
        localStorage.setItem(`note-list-${newList.id}`, JSON.stringify(newList));
        
        // Update lists index
        const listsStr = localStorage.getItem('note-lists') || '[]';
        const lists = JSON.parse(listsStr);
        lists.push({
          id: newList.id,
          content: listName,
          lastModified: Date.now()
        });
        localStorage.setItem('note-lists', JSON.stringify(lists));
        
        // Reload lists so model has access to new ID
        loadLists();
        
        console.log('Created new list:', newList);
        return newList.id; // Return ID for potential use in add to list
      }
      else if (cmd.command === "add to list" && cmd.variables && cmd.variables.length >= 3) {
        const [listId, pathArray, ...items] = cmd.variables;
        
        // Load the list
        const listStr = localStorage.getItem(`note-list-${listId}`);
        if (!listStr) return;
        
        const list = JSON.parse(listStr);
        
        // Helper to find target node
        const findNode = (node, path) => {
          if (path.length === 0) return node;
          const [index, ...rest] = path;
          if (!node.nested[index]) return null;
          return findNode(node.nested[index], rest);
        };
        
        // Find target node and add items
        const targetNode = findNode(list, pathArray);
        if (targetNode) {
          items.forEach(item => {
            targetNode.nested.push({
              id: Math.random().toString(36).substr(2, 9),
              content: item,
              isOpen: true,
              nested: []
            });
          });
          
          // Save updated list
          localStorage.setItem(`note-list-${listId}`, JSON.stringify(list));
          
          // Update last modified
          const listsStr = localStorage.getItem('note-lists') || '[]';
          const lists = JSON.parse(listsStr);
          const listIndex = lists.findIndex(l => l.id === listId);
          if (listIndex >= 0) {
            lists[listIndex].lastModified = Date.now();
            localStorage.setItem('note-lists', JSON.stringify(lists));
          }
          
          console.log('Added items to list:', items);
        }
      }
      else if (cmd.command === "load list" && cmd.variables && cmd.variables.length > 0) {
        const listId = cmd.variables[0];
        const listStr = localStorage.getItem(`note-list-${listId}`);
        if (listStr) {
          const list = JSON.parse(listStr);
          setTempMem(list);
          console.log('Loaded list into tempMem:', list);
        }
      }
    });
  }

  // Command action functions: 
  
  const addToShortTermMemory = (message) => {
    shortTermMemoryRef.current += message + "\n";
  };

  const updateSetting = (settingName, value) => {
    // Convert setting name to lowercase 
    const setting = settingName.toLowerCase();
    
    // Update the settings object with the new value
    setSettingsObject(prevSettings => {
      const newSettings = { ...prevSettings };
      
      switch (setting) {
        case 'ttsenabled':
          newSettings.ttsEnabled = value;
          break;
        case 'selectedvoice':
          newSettings.selectedVoice = value;
          break;
        case 'autosendenabled':
          newSettings.autoSendEnabled = value;
          break;
        case 'autosendtimeout':
          newSettings.autoSendTimeout = value;
          break;
        case 'previousmessagescount':
          newSettings.previousMessagesCount = value;
          break;
        case 'savehistoryenabled':
          newSettings.saveHistoryEnabled = value;
          break;
        case 'inactivitytimerenabled':
          newSettings.inactivityTimerEnabled = value;
          break;
        case 'showsettings':
          newSettings.showSettings = value;
          break;
        case 'showpromptpreface':
          newSettings.showPromptPreface = value;
          break;
        case 'showlongtermmemory':
          newSettings.showLongTermMemory = value;
          break;
        default:
          console.warn(`Unknown setting: ${settingName}`);
          return prevSettings;
      }

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      return newSettings;
    });
    return true;
  };
  
  // #endregion commands (from user and system)

  // #region inactivity timer

  // Reset inactivity timer when chat ID changes
  useEffect(() => {
    if (chatIdRef.current) {
      console.log('Chat ID changed, resetting inactivity timer');
      resetInactivityTimer();
    }
  }, [chatIdRef.current]);

  // Resets the inactivity timer so it sends a messages after 5 minutes
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

  // #endregion inactivity timer

  // #region chat loading and saving

  const loadChat = (chatId) => {
    const chat = chats[chatId];
    if (chat) {
      setMessages(chat.messages);
      chatIdRef.current = chatId;
      // Scroll to bottom after loading messages
      setTimeout(scrollToBottom, 100); // Small delay to ensure messages are rendered
    }
  };

  const saveCurrentChat = () => {
    if (!chatIdRef.current || messages.length === 0 || !settingsObject.saveHistoryEnabled) return;
    
    const updatedChats = {
      ...chats,
      [chatIdRef.current]: {
        ...chats[chatIdRef.current], // Preserve existing chat data like title
        messages: messages,
        timestamp: Date.now()
      }
    };
    setChats(updatedChats);
    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updatedChats));
  };

  // Save current chat when messages change
  useEffect(() => {
    if (chatIdRef.current) {
      saveCurrentChat();
    }
  }, [messages]);

  // #endregion chat loading and saving

  // #region chat changes

  const handleNewChat = () => {
    setMessages([]);
    chatIdRef.current = null;
    setShowMenu(false);
  };
  
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

  // #endregion chat changes

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
        longTermMemory={longTermMemory}
        setLongTermMemory={setLongTermMemory}
        settingsObject={settingsObject}
        setSettingsObject={setSettingsObject}
        voices={voices}
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
      <ChatInputArea
        inputRef={inputRef}
        lastSpokenTextRef={lastSpokenTextRef}
        isSpeaking={isSpeaking}
        isPaused={isPaused}
        togglePause={togglePause}
        handleSubmit={handleSubmit}
        settingsObject={settingsObject}
      />
      
    </div>
  )
}

export default AppHome