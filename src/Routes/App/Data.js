export const STORAGE_KEY = 'chat-app-settings';
export const CHATS_STORAGE_KEY = 'chat-app-chats';
export const LONG_TERM_MEMORY_KEY = 'chat-app-long-term-memory';
export const NOTE_STORAGE_KEY = 'chat-app-note';
export const POINTS_STORAGE_KEY = 'chat-app-points';
export const INACTIVITY_MESSAGE = 'User has been inactive for 5 minutes, attempt to reengage them';
export const AVAILABLE_COMMANDS = `Available commands:
1. command replay (number) - Replays the last few messages. For example: "command replay 3".
2. command repeat (number) - Same as replay.
3. command say (number) - Same as replay.
4. command replay all - Replays all messages from the start.
5. command setting auto send (true/false) - Enables or disables auto send.
6. command setting timeout (seconds) - Sets the auto send timeout.
7. command setting previous messages (number) - Sets how many previous messages to include.
8. command setting text to speech (true/false) - Enables or disables text to speech.
9. command setting save history (true/false) - Enables or disables chat history saving.
10. command setting inactivity timer (true/false) - Enables or disables the inactivity timer.
11. command note (text) - Adds text to the note stored in local storage.
12. note (text) - Directly adds text to your notes with double line breaks.
13. command speech reset - Resets all text-to-speech settings and state to default.
    command view chat sets the view to chat or list or swaps
`;
export const FORMAT_PREFACE = `
  Please format your responses as JSON with the following structure (the json will be parsed from this so it must be exact): 
  {
    content: <your message here>,
    ponts: int, // If the user completes a game or did something productive you can reward them with points. add the thing and number to long term mem so you can ref it for consistant numbers for thigns
    // you can send multiple commands 
    commands: [
      {
        command: <command name>,
        variables: [<variable values>]
      },
      ...
    ]
  }

  Available commands:
  "add to long term memory" - adds first variable to long term memory
  "overwrite long term memory" - replaces entire long term memory with first variable
  "add to note" - adds first variable to note in local storage
  "create list" - creates a new list with name from first variable
  "load list" - loads a list into tempMem. Variables: [listId]
  "add to list" - adds an item to a list. Variables: [listId, [path array (based on nested index ex: [0, 1])], item to add...]
    ex: commands: [{command: "add to list", variables: [<list id>, [<path ex: 0, 1>], "content text for item 1", "item 2 content"]}, ]
    remember each item has its own command and path

  "modify list item" vars: [<list id>, [...path], "new content string"] updates the content  of an item
  "switch view" - switches between chat and list view. specify view with teh variable "list or "chat". ONLY do this if the user specifically asks for it, never any other time. 
`;
export const PROMPT_PREFACE = `
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
export const PROMPT_PREFACE_KEY = 'chat-app-prompt-preface';
export const DEFAULT_SETTINGS = {
  ttsEnabled: true,
  selectedVoice: '',
  autoSendEnabled: true,
  autoSendTimeout: 5,
  previousMessagesCount: 10,
  saveHistoryEnabled: true,
  inactivityTimerEnabled: true,
  showSettings: false,
  showPromptPreface: false,
  showLongTermMemory: false,
  replayAllMessages: false,
  promptPreface: PROMPT_PREFACE,
  filterSpecialCharacters: true
}