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