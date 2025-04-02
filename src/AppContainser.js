import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Chat from './Routes/App/Chat';
import NestedList from './Routes/NestedList/NestedList';
import Menu from './Routes/App/Menu';
import { loadSettings, updateSetting } from './store/menuSlice';
import { setChatID } from './store/idsSlice';
import { CHATS_STORAGE_KEY, LONG_TERM_MEMORY_KEY, NOTE_STORAGE_KEY, FORMAT_PREFACE, PROMPT_PREFACE_KEY, PROMPT_PREFACE, INACTIVITY_MESSAGE, AVAILABLE_COMMANDS, STORAGE_KEY } from './Routes/App/Data';
import { removeSpecialCharacters, ellipsis } from './Routes/App/functions';
import ChatInputArea from './Routes/App/ChatInputArea';

/*
    This will have the menu in it
    it will have a state variable that determines if the chat or nested list view is showing
    the chatid and loaded nested list wil persist even when switching back and fourth from chat and nested list

    todo:

    put list id in redux so it persists
        and make it so when tha changes the ref in chat updates so it is always accessed before the fetch
    test taht switching back and fourth from chat and list they are both staying the same chat id and list id    
    
    put menu int app container so settings are available in both
    add setting for enter to create new list item

    organize files
    remove unused files

*/
function AppContainser() {
    const chatIdRef = useRef(null);
    const dispatch = useDispatch();
    
    const { chatID } = useSelector(state => state.main);
    const { componentDisplay } = useSelector(state => state.menu);

    const { settings } = useSelector(state => state.menu);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [tempMem, setTempMem] = useState(null);
    const [isPaused, setIsPaused] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [chats, setChats] = useState({});
  
    // For the current working list
    const workingListIDRef = useRef(null);
    // For replay (maybe not needed naymore)
    const lastSpokenTextRef = useRef('');
    // For the inactivity timer so user can be reminded
    const inactivityTimerRef = useRef(null);
    // For the inactivity count so it only reminds twice
    const inactivityCountRef = useRef(0);
    // A flag variable
    const hasFirstMessageRef = useRef(false);
  
    // Update chatIdRef when chatID changes
    useEffect(() => {
      if (chatIdRef) {
        chatIdRef.current = chatID;
      }
    }, [chatID, chatIdRef]);
  
    // Load messages when chat ID changes
    useEffect(() => {
        // Clear inactivity timer when chat id changes
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
  
      if (!chatID) {
        setMessages([]);
  
        return;
      }
  
      const chatData = localStorage.getItem(`chat-${chatID}`);
      if (chatData) {
        try {
          const parsedData = JSON.parse(chatData);
          setMessages(parsedData.messages || []);
        } catch (error) {
          console.error('Error loading chat:', error);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    }, [chatID]);
  
    // Component cleanup
    useEffect(() => {
      return () => {
        // Clear inactivity timer when component unmounts
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
          inactivityTimerRef.current = null;
        }
        inactivityCountRef.current = 0;
      };
    }, []);
  
    // #region loading
  
    // Loading settings chats and voices
    useEffect(() => {
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }, []);
  
    // #endregion loading
  
    // #region tts
    const resetSpeech = () => {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Reset state
      setIsSpeaking(false);
      setIsPaused(false);
      
      // Reset refs
      lastSpokenTextRef.current = '';
      
      // Remove any event listeners (will be re-added if needed)
      window.speechSynthesis.onvoiceschanged = null;
    }
  
    const speakText = async (text) => {
      if (!settings.ttsEnabled) return;
  
      // If already speaking, add to queue
      if (isSpeaking) {
        return;
      }
  
      // Apply text filtering if enabled in settings
      const finalText = settings.filterSpecialCharacters ? removeSpecialCharacters(text) : text;
  
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(finalText);
      if (settings.selectedVoice) {
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.name === settings.selectedVoice);
        if (voice) {
          utterance.voice = voice;
        }
      }
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
  
      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        setIsSpeaking(false);
      };
  
      window.speechSynthesis.speak(utterance);
      lastSpokenTextRef.current = finalText;
    };
  
    const speakMessages = (startIndex = 0, replayAll = false) => {
      if (!settings.ttsEnabled) return;
      
      // Clear any existing speech
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
  
      const messagesToSpeak = messages.slice(startIndex);
      
      const speakNext = (index) => {
        if (index < messagesToSpeak.length) {
          const message = messagesToSpeak[index];
          // Only speak assistant messages unless replayAll is true
          if (message.role === 'assistant' || settings.replayAllMessages || replayAll) {
            speakText(message.content, index);
          }
          // Move to next message after a short delay
          setTimeout(() => {
            speakNext(index + 1);
          }, 100);
        }
      };
  
      speakNext(0);
    };
  
    
    const togglePause = () => {
      const currentState = { speaking: isSpeaking, paused: isPaused };
      // console.log('Current state:', currentState);
  
      if (isSpeaking) {
        if (isPaused) {
          // Currently paused, should resume
          // console .log('Action: Resume speech');
          window.speechSynthesis.resume();
          setIsPaused(false);
        } else {
          // Currently speaking, should pause
          // console .log('Action: Pause speech');
          window.speechSynthesis.pause();
          setIsPaused(true);
        }
      } else if (lastSpokenTextRef.current) {
        // Not speaking, should start new speech
        // console .log('Action: Replay last speech');
        speakText(lastSpokenTextRef.current);
      }
  
      // Log state after change
      // setTimeout(() => {
      //   const newState = { speaking: isSpeaking, paused: isPaused };
      //   // console .log('New state:', newState);
      // }, 100);
    };
  
    // #endregion tts
  
    // #region sending and recieving
  
    // When text is being sent
    const handleSubmit = () => {
      const input = document.getElementById('chat-input');
      if (!input) return;
  
      const text = input.value.trim();
      if (!text) return;
  
      // Clear the input
      input.value = '';
  
      // Reset any auto-send timers
      if (input.onChange) {
        input.onChange({ target: input });
      }
  
      // Process input and only send to API if it's not a command
      if (processInput(text)) {
        handleSendMessage(text);
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
        timestamp: Date.now()
      };

      // Add the user message to localStorage
      addMessageToChat(userMessage);

      // Add user message to messages state
      setIsLoading(true);
      scrollToBottom();

      // Now fetch the response
      await fetchDeepSeek(userMessage);
      scrollToBottom(); // Add scroll after API response
    }
  
    // the list form promptPreface
    const createContestString = () => {
      let contextString = ""

      // Get the title data for all lists (get each time so current)
      const listsStr = localStorage.getItem('note-lists') || '[]';
      contextString += "lists: "+listsStr+"\n"
  
      // If there's a working list, add its data
      if (workingListIDRef.current) {
        const listData = localStorage.getItem(`note-list-${workingListIDRef.current}`);
        if (listData) {
          contextString += `working list data: ${listData}\n`;
        }
      }
  
      // Retained over all chats
      const retainedMemory = localStorage.getItem(LONG_TERM_MEMORY_KEY) || '';
      contextString += "retained mem: "+retainedMemory+"\n"
  
      // Specific to this chat
      contextString += "temp mem: "+tempMem+"\n"
      
      // Response format instructions
      contextString += "Always follow this: "+FORMAT_PREFACE+"\n"
  
      // Custom prompt preface
      const promptPreface = localStorage.getItem(PROMPT_PREFACE_KEY) || PROMPT_PREFACE;
      contextString += promptPreface+"\n";
      
      return contextString
    }
  
    // Sends a message to the API and waits for a response
    async function fetchDeepSeek(userMessage) {
      try {
        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const timeInfo = `Current time: ${now.toLocaleTimeString()}, ${days[now.getDay()]}, ${now.toLocaleDateString()}`;
  
        const apiKey = process.env.REACT_APP_DEEPSEEK_KEY;
        if (!apiKey) {
          console.error('REACT_APP_DEEPSEEK_KEY is not configured');
          throw new Error('DeepSeek API key is not configured');
        }
  
        const url = 'https://api.deepseek.com/chat/completions';
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        };
  
        console.log("key: ", process.env.REACT_APP_DEEPSEEK_KEY)
        console.log("process.env: ", process.env)
  
        const body = JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            // The contest like the preface, memory, date, etc
            { role: 'user', content: createContestString() },
            // The number of previous messages to include is in the settings
            ...messages.slice(-settings.previousMessagesCount || -4).map(msg => ({
              role: msg.role,
              content: msg.content
            })),
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
        const responseContent = data?.choices[0]?.message?.content
        const processedContent = processResponse(responseContent);
        const assistantMessage = {
          role: 'assistant',
          content: processedContent,
          contentRaw: responseContent,
          timestamp: Date.now(),
        };
        
        // Add assistant message to localStorage and messages array state
        addMessageToChat(assistantMessage);
  
        // Speak the response if TTS is enabled
        speakText(assistantMessage.content);
  
        // Reset inactivity timer after model responds
        resetInactivityTimer();
        scrollToBottom();
      } catch (error) {
        // console .error('Error:', error);
        const errorMessage = {
          role: 'assistant',
          content: 'Sorry, there was an error processing your request.',
          timestamp: Date.now()
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
  
    // #endregion sending and recieving
  
    // #region commands (from user and system)
  
    // User Commands:
    const handleCommand = (command, args) => {
      switch (command.toLowerCase()) {
        case 'replay':
        case 'repeat':
        case 'say':
          if (args[0] === 'all') {
            // Replay all messages from the start
            speakMessages(0, true);
          } else {
            const count = args[0] ? parseInt(args[0]) : 1;
            if (!isNaN(count)) {
              // Find indices of all assistant messages
              const assistantIndices = messages
                .map((m, index) => m.role === 'assistant' ? index : -1)
                .filter(index => index !== -1);
              
              if (assistantIndices.length > 0) {
                // Get the last count indices
                const targetIndices = assistantIndices.slice(-count);
                // Start from the earlier message
                const startIndex = targetIndices[0];
                speakMessages(startIndex);
              }
            } else {
              // If no count specified, replay most recent assistant message
              const lastAssistantIndex = messages
                .map((m, index) => m.role === 'assistant' ? index : -1)
                .filter(index => index !== -1)
                .pop();
                
              if (lastAssistantIndex !== undefined) {
                speakText(messages[lastAssistantIndex].content);
              }
            }
          }
          break;
  
        case 'setting':
        case 'settings':
        case 'update':
          if (args.length < 2) {
            // console .log('Usage: command setting <setting name> <value>');
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
            // console .log(`Updated ${settingName} to ${value}`);
          }
          break;
  
        case 'list':
          if (args[0]?.toLowerCase() === 'commands') {
            // console .log(AVAILABLE_COMMANDS);
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
            // console .log('Added to note:', noteText);
          }
          break;
  
        case 'set working list':
          // Set the working list ID to the first argument or null if no arguments
          workingListIDRef.current = args[0] || null;
          break;
  
        case 'speech':
          if (args[0] === 'reset') {
            resetSpeech();
          }
          break;
  
        default:
          // console .log('Unknown command:', command);
          speakText(`Unknown command: ${command}`);
      }
    };
  
    // Processes the response from the API
    const processResponse = (text) => {
      const cleanedText = removeSpecialCharacters(text);
      // console .log("cleanedText: ", cleanedText)
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
        // console .log('Response was not valid JSON, using as plain text:', e);
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
          
        }
        else if (cmd.command === "overwrite long term memory" && cmd.variables && cmd.variables.length > 0) {
          const newMemory = cmd.variables[0];
          
          // Update localStorage
          localStorage.setItem(LONG_TERM_MEMORY_KEY, newMemory);
          
        }
        else if (cmd.command === "clear long term memory") {
          // Update localStorage
          localStorage.setItem(LONG_TERM_MEMORY_KEY, '');
        }
        else if (cmd.command === "add to note" && cmd.variables && cmd.variables.length > 0) {
          const newNote = cmd.variables[0];
          // Append to existing note with a newline
          const currentNote = localStorage.getItem(NOTE_STORAGE_KEY) || '';
          const updatedNote = currentNote ? `${currentNote}\n${newNote}` : newNote;
          
          // Update localStorage
          localStorage.setItem(NOTE_STORAGE_KEY, updatedNote);
          
          // console .log('Updated note:', updatedNote);
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
          
          // console .log('Created new list:', newList);
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
            
            // console .log('Added items to list:', items);
          }
        }
        else if (cmd.command === "load list" && cmd.variables && cmd.variables.length > 0) {
          const listId = cmd.variables[0];
          const listStr = localStorage.getItem(`note-list-${listId}`);
          if (listStr) {
            const list = JSON.parse(listStr);
            setTempMem(list);
            // console .log('Loaded list into tempMem:', list);
          }
        }
      });
    }
  
    // Command action functions: 
    
  
    const updateSetting = (settingName, value) => {
      dispatch(updateSetting({ name: settingName.toLowerCase(), value }));
      return true;
    };
    
    // #endregion commands (from user and system)
  
    // #region inactivity timer
  
    // Reset inactivity timer when chat ID changes
    useEffect(() => {
      if (chatIdRef.current) {
        // console .log('Chat ID changed, resetting inactivity timer');
        resetInactivityTimer();
      }
    }, [chatIdRef.current]);
  
    // Resets the inactivity timer so it sends a messages after 5 minutes
    const resetInactivityTimer = () => {
      if (!hasFirstMessageRef.current || !settings.inactivityTimerEnabled) return;
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      // Only set new timer if we haven't hit the limit
      if (inactivityCountRef.current < 2) {
        inactivityTimerRef.current = setTimeout(() => {
          const inactivityUserMessage = {
            role: 'user',
            content: INACTIVITY_MESSAGE,
            timestamp: Date.now()
          };
          inactivityCountRef.current += 1;
          fetchDeepSeek(inactivityUserMessage);
        }, 5 * 60 * 1000); 
      }
    };
  
    // #endregion inactivity timer
  
    // #region chat loading and saving
  
  
    // Load chat when chat ID changes
    useEffect(() => {
      if (!chatIdRef.current) {
        setMessages([]);
        return;
      }
  
      // Load messages from chat-chatID
      const chatData = localStorage.getItem(`chat-${chatIdRef.current}`);
      if (chatData) {
        try {
          const parsedData = JSON.parse(chatData);
          setMessages(parsedData.messages || []);
        } catch (error) {
          console.error('Error parsing chat data:', error);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    }, [chatIdRef.current]);
  
    // Creates a new chat and returns the chatID
    function createChat(message){
      // Generate new chat ID
      const newChatId = Date.now().toString();
      
      // Load existing chats
      const chatsStr = localStorage.getItem('chats') || '[]';
      const chats = JSON.parse(chatsStr);
      
      // Create new chat entry
      const newChat = {
        id: newChatId,
        title: ellipsis(message.content, 20),
        timestamp: Date.now()
      };
      
      // Add to chats array
      chats.push(newChat);
      
      // Save updated chats
      localStorage.setItem('chats', JSON.stringify(chats));
      
      // Create chat messages storage
      const chatData = {
        messages: message ? [message] : []
      };
      localStorage.setItem(`chat-${newChatId}`, JSON.stringify(chatData));
      
      dispatch(setChatID(newChatId))
      return newChatId;
    }
  
    // Adds a message to chat in localStorage
    function addMessageToChat(message){
      setMessages(messages=>[...messages, message]);
  
      // If there is no chatID create a chat (will add the first message)
      if(!chatIdRef.current || !localStorage.getItem(`chat-${chatIdRef.current}`)){
        createChat(message);
      }
      // If chat exists in localStorage, update it
      else {
        try {
          // Get existing chat data
          const chatData = JSON.parse(localStorage.getItem(`chat-${chatIdRef.current}`));
          chatData.messages = [...(chatData.messages || []), message];
          
          // Update chat timestamp in chats list
          const chats = JSON.parse(localStorage.getItem('chats') || '[]');
          const chatIndex = chats.findIndex(c => c.id === chatIdRef.current);
          
          // Update the title timestamp
          if (chatIndex === -1) {
            // Create new chat entry if it doesn't exist
            chats.push({
              id: chatIdRef.current,
              title: ellipsis(message.content, 20),
              timestamp: Date.now()
            });
          } else {
            chats[chatIndex].timestamp = Date.now();
          }
          
          // Save updated chats array
          localStorage.setItem('chats', JSON.stringify(chats));
          
          // Save updated chat messages
          localStorage.setItem(`chat-${chatIdRef.current}`, JSON.stringify(chatData));
        } catch (error) {
          speakMessages("Error adding message")
          console.error('Error updating chat:', error);
        }
      }
    }
  
    // #endregion chat loading and saving
  
    // #region chat changes
  
    const handleNewChat = () => {
      setMessages([]);
      chatIdRef.current = null;
      dispatch(setChatID(null));
    };
    
  
    const handleDeleteChat = (chatId) => {
      // Load current chats
      const chatsStr = localStorage.getItem('chats') || '[]';
      const chats = JSON.parse(chatsStr);
      
      // Remove the chat
      const updatedChats = chats.filter(chat => chat.id !== chatId);
      localStorage.setItem('chats', JSON.stringify(updatedChats));
      
      // Remove chat messages
      localStorage.removeItem(`chat-${chatId}`);
      
      // If the deleted chat was the current chat, create a new chat
      if (chatId === chatIdRef.current) {
        handleNewChat();
      }
    };
  
    const handleImportChat = (chatData) => {
      // Generate new chat ID
      const chatId = Date.now().toString();
      
      // Create chat entry
      const newChat = {
        id: chatId,
        title: chatData.title || chatData.messages[0]?.content ? ellipsis(chatData.messages[0].content, 20) + " Imported": 'Imported Chat',
        timestamp: Date.now()
      };
      
      // Load and update chats array
      const chatsStr = localStorage.getItem('chats') || '[]';
      const chats = JSON.parse(chatsStr);
      chats.push(newChat);
      localStorage.setItem('chats', JSON.stringify(chats));
      
      // Save chat messages
      localStorage.setItem(`chat-${chatId}`, JSON.stringify(chatData));
      
      // Switch to new chat
      dispatch(setChatID(chatId));
    };
  
    // #endregion chat changes
  

    // Load settings from localStorage on mount
    useEffect(() => {
        const storedSettings = localStorage.getItem('settings');
        if (storedSettings) {
            try {
                const settings = JSON.parse(storedSettings);
                dispatch(loadSettings(settings));
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        }
    }, [dispatch]);

    // Scroll when messages change
    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    // Update chatIdRef when chatID changes
    useEffect(() => {
        chatIdRef.current = chatID;
        scrollToBottom();
    }, [chatID]);

    // Scroll messages to bottom
    const scrollToBottom = () => {
        console.log("scrollToBottom")
        const element = document.querySelector('#messages-container');
        console.log("element: ", element)
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    };

    return (
        <div className="app-container">
            <Menu scrollToBottom={scrollToBottom} />
            {componentDisplay === "chat" ?
                <Chat
                    chatIdRef={chatIdRef}
                    scrollToBottom={scrollToBottom}
                    messages={messages}
                    handleSendMessage={handleSendMessage}
                    settings={settings}
                    speakMessages={speakMessages}
                    isLoading={isLoading}
                />
                :
                <NestedList />
            }
            <ChatInputArea
              lastSpokenTextRef={lastSpokenTextRef}
              isSpeaking={isSpeaking}
              isPaused={isPaused}
              togglePause={togglePause}
              handleSubmit={handleSubmit}
            />
        </div>
    );
}

export default AppContainser;