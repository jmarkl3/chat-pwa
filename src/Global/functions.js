
export const findNumberInArgs = (args) => {
    // Look through all args to find a number
    for (const arg of args) {
      const num = wordToNumber(arg);
      if (num !== null) {
        return num;
      }
    }
    return 1; // Default to 1 if no number found
  };

  export const wordToNumber = (word) => {
    const numberWords = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'to': 2, 'too': 2, // Common TTS interpretations
      '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
      '6': 6, '7': 7, '8': 8, '9': 9, '10': 10
    };
    return numberWords[word.toLowerCase()] || null;
  };
  
  export const removeSpecialCharacters = (text) => {
    return text.replace(/[\*\-\/]/g, '');
  };

  export function ellipsis(str, n = 20) {
    // Check if the string is longer than the specified length
    if (str.length > n) {
        return str.substring(0, n) + '...';
    }
    // If not, return the original string
    return str;
}

// Attempts to extract and parse valid JSON from a text that might contain multiple JSON objects
// or have invalid prefixes/suffixes
export function extractAndParseJSON(text) {
  console.log('Raw response from DeepSeek:', text);
  
  // Remove any "json" prefix and trim whitespace
  let cleanText = text.trim();
  console.log('Cleaned text:', cleanText);

  // If the text is wrapped in single quotes, remove them
  if (cleanText.startsWith("'") && cleanText.endsWith("'")) {
    cleanText = cleanText.slice(1, -1);
    console.log('Removed single quotes:', cleanText);
  }

  // Replace escaped single quotes with regular single quotes
  cleanText = cleanText.replace(/\\'/g, "'");
  console.log('After fixing escaped quotes:', cleanText);

  // Try to parse the entire text as JSON first
  try {
    const parsed = JSON.parse(cleanText);
    console.log('Successfully parsed complete JSON:', parsed);
    
    // Validate the expected structure
    if (parsed && 
        typeof parsed === 'object' && 
        typeof parsed.title === 'string' && 
        Array.isArray(parsed.messages) &&
        parsed.messages.every(msg => 
          msg && 
          typeof msg === 'object' && 
          typeof msg.content === 'string' && 
          ['user', 'assistant'].includes(msg.role)
        )) {
      return parsed;
    }
  } catch (e) {
    console.log('Failed to parse complete JSON:', e.message);
  }

  throw new Error('No valid JSON object found with expected chat format');
}
export function generateId() {
  return Math.random().toString(36).substring(2, 10);
}