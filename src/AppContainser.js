import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Chat from './Routes/Chat/Chat';
import NestedList from './Routes/NestedList/NestedList';
import { loadSettings, updateSetting, setComponentDisplay } from './store/menuSlice';
import { setChatID, setListID, updateListTimestamp } from './store/idsSlice';
import { CHATS_STORAGE_KEY, LONG_TERM_MEMORY_KEY, NOTE_STORAGE_KEY, FORMAT_PREFACE, PROMPT_PREFACE_KEY, PROMPT_PREFACE, INACTIVITY_MESSAGE, AVAILABLE_COMMANDS, STORAGE_KEY, POINTS_STORAGE_KEY, conversationalGamesObject } from './Global/Data';
import { removeSpecialCharacters, ellipsis } from './Global/functions';
import ChatInputArea from './Routes/Chat/ChatInputArea';
import Menu from './Components/Menus/Menu';

/*
    
    maybe add later:
      nested list
        improve the note that instructs the system on how to respond
        also handle more possible responses
          save examples when it does and doesn't work (they are in the history so just make note)
        also move list item in and out depth menu options
        top buttons bar in list editor
        command to open and close items (by index or name)
          could tell the system the name and it will find the path
    
      points
      
      better menu
        decides if it should show left or right up or down based on screen position and screen height width

      https://murf.ai/api

*/
function AppContainser() {
    const chatIdRef = useRef(null);
    const dispatch = useDispatch();
    const [dailyPoints, setDailyPoints] = useState(0);
    
    const { chatID, listID } = useSelector(state => state.main);
    const { componentDisplay } = useSelector(state => state.menu);
    const { selectedListID, listData } = useSelector(state => state.list);

    const { settings } = useSelector(state => state.menu);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [tempMem, setTempMem] = useState(null);
    const [isPaused, setIsPaused] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [chats, setChats] = useState({});
  
    // For the current working list
    const selectedListIDRef = useRef(null);
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
  
    // Maintain the ref same as the listID in redux sate
    useEffect(()=>{
      selectedListIDRef.current = listID
    },[listID])

    // Save listData whenever it changes - moved from NestedList to AppContainser
    useEffect(() => {
      if (selectedListID && listData) {
        // Save the full list listData
        localStorage.setItem(`note-list-${selectedListID}`, JSON.stringify(listData));

        // Update the lists index
        const listsStr = localStorage.getItem('note-lists') || '[]';
        const lists = JSON.parse(listsStr);
        const timestamp = Date.now();

        const updatedLists = lists.filter(l => l.id !== selectedListID);
        updatedLists.push({
          id: selectedListID,
          content: listData.content,
          timestamp: timestamp
        });

        // Sort by timestamp, most recent first
        updatedLists.sort((a, b) => b.timestamp - a.timestamp);
        localStorage.setItem('note-lists', JSON.stringify(updatedLists));
      }
    }, [listData, selectedListID]);

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
  
    // Checks to see if its a command, if so calls handleUserCommand
    const processInput = (input) => {
      const words = input.trim().split(/\s+/);
      let firstWord = words[0].toLowerCase()
      if (words.length >= 2 && (firstWord === 'command' || firstWord === 'commands')) {
        const command = words[1];
        const args = words.slice(2);
        handleUserCommand(command, args);
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
  
    /*
    This function takes a stringified json, 
      {content: "text", nested: [{...same nested},...]}, 
    adds an index attribute corresponding to the index of the nested objects in the nested array attribute
    and turns it back into a stringified json 
    
    */ 
  function addIndexsToNestedList(listsString) {
    try {
        const parsedData = JSON.parse(listsString);
        
        const processNested = (obj, index = null) => {
            // Create a new object with shallow copy of properties
            let newObj = {};
            
            // Add index if provided (first so it shows up on top for legibility)
            if (index !== null) {
                newObj.index = index;
            }
            
            console.log("newObj:", newObj)
            // Now add all of the other data
            newObj = {...newObj, ...obj}
            console.log("newObj2:", newObj)
            
            // Process nested array if it exists
            if (obj.nested && Array.isArray(obj.nested)) {
                newObj.nested = obj.nested.map((item, idx) => 
                    processNested(item, idx)
                );
            }
            
            return newObj;
        };
        
        const resultData = processNested(parsedData);
        return JSON.stringify(resultData);
    } catch (error) {
        console.error("Error processing JSON:", error);
        return listsString;
    }
}
    // the list form promptPreface
    const createContentString = () => {
      let contextString = ""

      // Get the title data for all lists (get each time so current)
      const listsStr = localStorage.getItem('note-lists') || '[]';
      contextString += "lists: "+listsStr+"\n"
  
      // If there's a working list, add its data
      if (selectedListIDRef.current) {
        const listData = localStorage.getItem(`note-list-${selectedListIDRef.current}`);
        if (listData) {
          const listWithIndexValues = addIndexsToNestedList(listData)
          console.log("listWithIndexValues: ", listWithIndexValues)
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
      
      contextString += "Game rules: "+conversationalGamesObject["connect3"]
  
      // Custom prompt preface (custom if there is one, else default)
      const promptPreface = localStorage.getItem(PROMPT_PREFACE_KEY) || PROMPT_PREFACE;
      contextString += promptPreface+"\n";
      
      return contextString
    }
  




  
    // Sends a message to the API and waits for a response
    async function fetchDeepSeek(userMessage) {
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

      const bodyJson = {
        model: 'deepseek-chat',
        messages: [
          // The contest like the preface, memory, date, etc
          { role: 'user', content: createContentString() },
          // The number of previous messages to include is in the settings
          ...messages.slice(-settings.previousMessagesCount || -4).map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          userMessage,
          { role: 'system', content: FORMAT_PREFACE }
        ],
        stream: false,
      }
      console.log("body jaon: ", bodyJson)
      const body = JSON.stringify(bodyJson)

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      try {

      const data = await response.json();
      console.log("retch data response: ", data)
      const responseContent = data?.choices[0]?.message?.content
      // Parses the json, handles commands or points, returns message text
      const processedContent = processResponse(responseContent);
      const assistantMessage = {
        // in case there is anything interesting in here
        content: processedContent?.content,
        role: 'assistant',
        processedContent: processedContent,
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
        content: 'Sorry, there was an error processing your request. error: '+error,
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
    }
    setIsLoading(false);
  }

  
    // #endregion sending and recieving
  
    // #region commands (from user and system)
  
    // User Commands:
    const handleUserCommand = (command, args) => {
      switch (command.toLowerCase()) {
        case 'replay':
        case 'repeat':
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
            speakText(`Updated ${settingName} to ${value}`);
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
            speakText('Note updated');
          }
          break;
  
        case 'speech':
          if (args[0] === 'reset') {
            resetSpeech();
            speakText('Speech reset');
          }
          break;
  
        case 'view':
          // Get requested view from args
          const requestedView = args && args.length > 0 ? args[0] : null;
          let newView;
          
          if (requestedView === "list" || requestedView === "chat") {
            // Use specified view
            newView = requestedView;
          } else {
            // If no valid view specified, swap current view
            newView = componentDisplay === "chat" ? "list" : "chat";
          }
          
          // Switch to the new view
          dispatch(setComponentDisplay(newView));
          
          // Scroll to bottom if switching to chat view
          if (newView === "chat") {
            setTimeout(() => {
              scrollToBottom();
            }, 100);
          }
          // speakText(`Switched to ${newView} view`);
          break;
  
        default:
          // console .log('Unknown command:', command);
          speakText(`Unknown command: ${command}`);
      }
    };
  
    /*
      This fonctin should combite the jsons on to one if there are multiple
      find the message attribute and others if it is not formatted correctly for json.parse
      and if there is no valid json return a json with content: <the whole text>
    */
    function extractJSON(text) {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          try {
              const jsonStr = text.slice(jsonStart, jsonEnd + 1);
              
              const parsed = JSON.parse(jsonStr);
              
              // Ensure we have at least a message property
              return {
                  content: parsed.content || text, // Fallback to full text
                  ...parsed
              };
          } catch (e) {
              // Extraction failed - fall through
          }
      }

      // 3. Final fallback - use entire text as message
      return { content: text };
    }
    function extractJSON2(text) {
      let startIndex = text.indexOf('{');
      if (startIndex === -1) return { content: text };
  
      let braceCount = 1;
      let currentIndex = startIndex + 1;
  
      while (currentIndex < text.length && braceCount > 0) {
          const char = text[currentIndex];
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
          currentIndex++;
      }
  
      if (braceCount === 0) {
          const jsonStr = text.slice(startIndex, currentIndex);
          try {
              const parsed = JSON.parse(jsonStr);
              return {
                  content: parsed.content || text,
                  ...parsed
              };
          } catch (e) {
              console.error("JSON parse error:", e);
              return { content: text };
          }
      }
  
      return { content: text };
  }

    // Processes the response from the API 
    const processResponse = (text) => {
      // TODO: look for content: in the response as a fallback, if not and no json use the full response as the message, if json and no message put <no message>
      try{
        let json = extractCommands(text)
        handleApiCommand(json.commands)
        addToPoints(json.points);
        return json
      }
      catch{
        // A default json to response with 
        return {content: text}
      }
    };
    function extractCommands(string) {
      // Split the string into parts using the command delimiter '##'
      const parts = string.split('##');
      
      // The first part is always the message content
      const content = parts[0].trim();
      
      // Initialize commands array
      const commands = [];
      
      // Process each command after the first part
      for (let i = 1; i < parts.length; i++) {
        const commandPart = parts[i].trim();
        if (!commandPart) continue; // skip empty commands
        
        // Split the command into its components
        const commandComponents = commandPart.split(',,');
        
        // The first component is the command name
        const cmd = commandComponents[0].trim();
        
        // The remaining components are variables
        const vars = [];
        for (let j = 1; j < commandComponents.length; j++) {
          const variable = commandComponents[j].trim();
          if (variable) { // only add non-empty variables
            vars.push(variable);
          }
        }
        
        // Add the command to the commands array
        commands.push({
          cmd: cmd,
          vars: vars
        });
      }
      
      // Return the structured object
      return {
        content: content,
        commands: commands
      };
    }

    function handleApiCommand(commands){
      commands.forEach(cmd => {
        console.log("Processing "+cmd)

        if (cmd.command === "add to long term memory" && cmd.variables && cmd.variables.length > 0) {
          try {
            const newMemory = cmd.variables[0];
            // Append to existing memory with a newline
            const currentMemory = localStorage.getItem(LONG_TERM_MEMORY_KEY) || '';
            const updatedMemory = currentMemory ? `${currentMemory}\n${newMemory}` : newMemory;
            
            // Update localStorage
            localStorage.setItem(LONG_TERM_MEMORY_KEY, updatedMemory);
            speakText('Memory updated');
          } catch (error) {
            speakText('Error updating memory');
          }
        }
        else if (cmd.command === "overwrite long term memory" && cmd.variables && cmd.variables.length > 0) {
          try {
            const newMemory = cmd.variables[0];
            localStorage.setItem(LONG_TERM_MEMORY_KEY, newMemory);
            speakText('Memory overwritten');
          } catch (error) {
            speakText('Error overwriting memory');
          }
        }
        else if (cmd.command === "clear long term memory") {
          try {
            localStorage.setItem(LONG_TERM_MEMORY_KEY, '');
            speakText('Memory cleared');
          } catch (error) {
            speakText('Error clearing memory');
          }
        }
        else if (cmd.command === "modify list item" && cmd.variables && cmd.variables.length >= 3) {
          try {
            const listId = cmd.variables[0];
            const path = cmd.variables[1];
            const newContent = cmd.variables[2];
            
            const listDataStr = localStorage.getItem(`note-list-${listId}`);
            if (listDataStr) {
              const listData = JSON.parse(listDataStr);
              
              // Navigate to the target item using the path
              let current = listData;
              for (let i = 0; i < path.length - 1; i++) {
                current = current.nested[path[i]];
              }
              
              // Update the target item's content
              const targetIndex = path[path.length - 1];
              current.nested[targetIndex].content = newContent;
              
              // Save the updated list
              localStorage.setItem(`note-list-${listId}`, JSON.stringify(listData));
              
              // Update last modified
              const listsStr = localStorage.getItem('note-lists') || '[]';
              const lists = JSON.parse(listsStr);
              const timestamp = Date.now();
              
              const updatedLists = lists.map(l => 
                l.id === listId 
                  ? { ...l, timestamp: timestamp }
                  : l
              );
              
              // Sort by timestamp
              updatedLists.sort((a, b) => b.timestamp - a.timestamp);
              localStorage.setItem('note-lists', JSON.stringify(updatedLists));
              speakText(`Updated item at path ${path.join(', ')}`);
            }
          } catch (error) {
            speakText('Error updating list item');
          }
        }
        else if (cmd.command === "add to note" && cmd.variables && cmd.variables.length > 0) {
          try {
            const newNote = cmd.variables[0];
            // Append to existing note with a newline
            const existingNote = localStorage.getItem(NOTE_STORAGE_KEY) || '';
            localStorage.setItem(NOTE_STORAGE_KEY, existingNote + (existingNote ? '\n\n' : '') + newNote);
            speakText('Note updated');
          } catch (error) {
            speakText('Error updating note');
          }
        }
        else if (cmd.command === "create list" && cmd.variables && cmd.variables.length > 0) {
          try {
            const listName = cmd.variables[0];
            const newList = {
              id: Math.random().toString(36).substr(2, 9),
              content: listName,
              isOpen: true,
              nested: []
            };
            
            // Save the new list data
            localStorage.setItem(`note-list-${newList.id}`, JSON.stringify(newList));
            
            // Update lists index
            const listsStr = localStorage.getItem('note-lists') || '[]';
            const lists = JSON.parse(listsStr);
            const timestamp = Date.now();
            
            lists.push({
              id: newList.id,
              content: listName,
              timestamp: timestamp
            });
            localStorage.setItem('note-lists', JSON.stringify(lists));
            speakText(`Created new list: ${listName}`);
            return newList.id;
          } catch (error) {
            speakText('Error creating list');
          }
        }
        else if (cmd.command === "add to list" && cmd.variables && cmd.variables.length >= 3) {
          try {
            const [listId, pathArray, ...items] = cmd.variables;
            
            // Load the list
            const listStr = localStorage.getItem(`note-list-${listId}`);
            if (!listStr) {
              speakText('List not found');
              return;
            }
            
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
                lists[listIndex].timestamp = Date.now();
                localStorage.setItem('note-lists', JSON.stringify(lists));
              }

              // Notify that list has been updated
              dispatch(updateListTimestamp());
              
              speakText(`Added ${items.length} items to list at path ${pathArray.join(', ')}`);
            } else {
              speakText('Target node not found');
            }
          } catch (error) {
            speakText('Error adding items to list');
          }
        }
        else if (cmd.command === "load list" && cmd.variables && cmd.variables.length > 0) {
          const listId = cmd.variables[0];
          dispatch(setListID(listId))
          selectedListIDRef.current = listId
          console.log("set selectedListIDRef to ", selectedListIDRef)
        }
        else if (cmd.command === "switch view") {
          try {
            // Get requested view from variables
            const requestedView = cmd.variables && cmd.variables.length > 0 ? cmd.variables[0] : null;
            let newView;
            
            if (requestedView === "list" || requestedView === "chat") {
              // Use specified view
              newView = requestedView;
            } else {
              // If no valid view specified, swap current view
              newView = componentDisplay === "chat" ? "list" : "chat";
            }
            
            // Switch to the new view
            dispatch(setComponentDisplay(newView));
            
            // Scroll to bottom if switching to chat view
            if (newView === "chat") {
              setTimeout(() => {
                scrollToBottom();
              }, 100);
            }
            speakText(`Switched to ${newView} view`);
          } catch (error) {
            speakText('Error switching view');
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
  
    useEffect(() => {
      loadDailyPoints();
    }, []);

    const loadDailyPoints = () => {
      const today = new Date().toISOString().split('T')[0];
      const pointsData = JSON.parse(localStorage.getItem(POINTS_STORAGE_KEY) || '{}');
      setDailyPoints(pointsData[today] || 0);
    };

    const addToPoints = (points) => {
      const today = new Date().toISOString().split('T')[0];
      const pointsData = JSON.parse(localStorage.getItem(POINTS_STORAGE_KEY) || '{}');
      pointsData[today] = (pointsData[today] || 0) + points;
      localStorage.setItem(POINTS_STORAGE_KEY, JSON.stringify(pointsData));
      setDailyPoints(pointsData[today]);
    };

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
                    dailyPoints={dailyPoints}
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