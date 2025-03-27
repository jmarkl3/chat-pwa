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
const NOTE_STORAGE_KEY = 'chat-app-note';
const INACTIVITY_MESSAGE = 'User has been inactive for 5 minutes, attempt to reengage them';
const AVAILABLE_COMMANDS = `Available commands:
1. command replay (number) - Replays the last few messages. For example: "command replay 3".
2. command repeat (number) - Same as replay.
3. command say (number) - Same as replay.
4. command setting auto send (true/false) - Enables or disables auto send.
5. command setting timeout (seconds) - Sets the auto send timeout.
6. command setting previous messages (number) - Sets how many previous messages to include.
7. command setting text to speech (true/false) - Enables or disables text to speech.
8. command setting save history (true/false) - Enables or disables chat history saving.
9. command setting inactivity timer (true/false) - Enables or disables the inactivity timer.
10. command note (text) - Adds text to the note stored in local storage.
`;
const FORMAT_PREFACE = `
    Please format your responses as JSON with the following structure (the json will be parsed from this so it must be exact): 
    {
      message: <your message here>,
      commands: [
        {
          command: <command name>,
          variables: [<variable values>]
        },
        ...
      ]
    }

    Available commands:
    1. "add to long term memory" - adds first variable to long term memory
    2. "overwrite long term memory" - replaces entire long term memory with first variable
    3. "clear long term memory" - clears all long term memory (no variables needed)
  `;
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
  const [showNote, setShowNote] = useState(false);
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
  const [inactivityTimerEnabled, setInactivityTimerEnabled] = useState(true);
  const [note, setNote] = useState(() => {
    const savedNote = localStorage.getItem(NOTE_STORAGE_KEY);
    return savedNote || '';
  });

  const chatIdRef = useRef(null);
  const lastSpokenTextRef = useRef('');
  const shortTermMemoryRef = useRef('');
  const inputRef = useRef(null);
  const autoSendTimerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const inactivityCountRef = useRef(0);
  const hasFirstMessageRef = useRef(false);
  const textQueue = useRef([]);

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
          saveHistoryEnabled: settings.saveHistoryEnabled ?? true,
          inactivityTimerEnabled: settings.inactivityTimerEnabled ?? true
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
      saveHistoryEnabled: true,
      inactivityTimerEnabled: true
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
    setInactivityTimerEnabled(settings.inactivityTimerEnabled);

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

  const speakText = async (text, index = 0) => {
    if (!ttsEnabled) return;

    // If already speaking, add to queue
    if (isSpeaking) {
      textQueue.current.push({ text, index });
      return;
    }

    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.onend = () => {
      // If there are messages in the queue, speak the next one
      if (textQueue.current.length > 0) {
        const nextItem = textQueue.current.shift();
        speakText(nextItem.text, nextItem.index);
      } else {
        setIsSpeaking(false);
      }
    };

    utterance.onerror = (event) => {
      console.log('Speech error:', event);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const speakMessages = (startIndex = 0) => {
    if (!ttsEnabled) return;
    
    // Clear any existing speech
    window.speechSynthesis.cancel();
    textQueue.current = [];
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
      setAutoSendEnabled(parsedValue);
      settingDisplayName = 'auto send';
    }
    else if (setting.includes('timeout') || setting.includes('auto send timeout')) {
      const timeoutValue = parseInt(value) || 5;
      setAutoSendTimeout(timeoutValue);
      settingDisplayName = 'auto send timeout';
    }
    else if (setting.includes('previous message') || setting.includes('messages')) {
      const messageCount = parseInt(value) || 10;
      setPreviousMessagesCount(messageCount);
      settingDisplayName = 'previous messages';
    }
    else if (setting.includes('text to speech') || setting === 'tts') {
      setTtsEnabled(parsedValue);
      settingDisplayName = 'text to speech';
    }
    else if (setting.includes('save history') || setting === 'history') {
      setSaveHistoryEnabled(parsedValue);
      settingDisplayName = 'save history';
    }
    else if (setting.includes('inactivity timer')) {
      setInactivityTimerEnabled(parsedValue);
      settingDisplayName = 'inactivity timer';
    }
    else {
      console.log('Unknown setting:', settingName);
      console.log('Available settings: auto send, timeout, previous messages, text to speech (tts), save history, inactivity timer');
      return false;
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ttsEnabled,
      selectedVoice,
      autoSendEnabled,
      autoSendTimeout,
      previousMessagesCount,
      saveHistoryEnabled,
      inactivityTimerEnabled
    }));

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

      case 'note':
        if (args.length > 0) {
          const newText = args.join(' ');
          const updatedNote = note ? `${note}\n\n${newText}` : newText;
          setNote(updatedNote);
          localStorage.setItem(NOTE_STORAGE_KEY, updatedNote);
          console.log('Added to note:', newText);
          speakText('note updated');
        } else {
          console.log('Usage: command note <text>');
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
          { role: 'system', content: FORMAT_PREFACE + "\n\n" + settingsPromptPreface},
          { role: 'system', content: "Memory from previous: " + longTermMemory},
          { role: 'system', content: timeInfo},
          ...messages.slice(-previousMessagesCount),
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
    if (!hasFirstMessageRef.current || !inactivityTimerEnabled) return;
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
      saveHistoryEnabled,
      inactivityTimerEnabled
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  };

  const handleNoteChange = (e) => {
    const newNote = e.target.value;
    setNote(newNote);
    localStorage.setItem(NOTE_STORAGE_KEY, newNote);
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
      if (saveHistoryEnabled) {
        localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updatedChats));
      }
    }
  };

  const handleDeleteChat = (chatId) => {
    const { [chatId]: deletedChat, ...remainingChats } = chats;
    setChats(remainingChats);
    if (saveHistoryEnabled) {
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(remainingChats));
    }
    // If the deleted chat was the current chat, create a new chat
    if (chatId === chatIdRef.current) {
      handleNewChat();
    }
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
        setShowNote={setShowNote}
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
            selectedVoice={selectedVoice}
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
        autoSendTimeout={autoSendTimeout}
        setAutoSendTimeout={setAutoSendTimeout}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        setShowPromptPreface={setShowPromptPreface}
        previousMessagesCount={previousMessagesCount}
        setPreviousMessagesCount={setPreviousMessagesCount}
        setShowLongTermMemory={setShowLongTermMemory}
        saveHistoryEnabled={saveHistoryEnabled}
        setSaveHistoryEnabled={setSaveHistoryEnabled}
        inactivityTimerEnabled={inactivityTimerEnabled}
        setInactivityTimerEnabled={setInactivityTimerEnabled}
        setShowNote={setShowNote}
      />
      <ChatHistory
        isOpen={showHistory}
        setIsOpen={setShowHistory}
        chats={chats}
        onSelectChat={loadChat}
        currentChatId={chatIdRef.current}
        onNewChat={handleNewChat}
        onUpdateChat={handleUpdateChat}
        onDeleteChat={handleDeleteChat}
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
      <SlidePanel title="Note" isOpen={showNote} setIsOpen={setShowNote}>
        <textarea
          value={note}
          onChange={handleNoteChange}
          style={{ width: '100%', height: '400px', padding: '8px' }}
          placeholder="Enter your notes here..."
        />
      </SlidePanel>
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
            longTermMemory: initialLongTermMemory,
            inactivityTimerEnabled
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
            longTermMemory: initialLongTermMemory,
            inactivityTimerEnabled
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        }}
      />
    </div>
  )
}

export default AppHome