import React, { useState } from 'react';
import SlidePanel from './SlidePanel';
import { extractAndParseJSON } from './functions';
import './ImportChat.css';

function ImportChat({ isOpen, setIsOpen, onImport, onSuccess }) {
  const [importText, setImportText] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJsonImport = async () => {
    try {
      if (!importText.trim()) {
        setError('Please enter the chat data');
        return;
      }

      const chatData = JSON.parse(importText.trim());
      onImport(chatData);
      setImportText('');
      setError('');
      setIsOpen(false);
      if (onSuccess) {
        onSuccess(); // Call the success callback to trigger chat reload
      }
    } catch (err) {
      setError('Failed to import JSON: ' + err.message);
    }
  };

  const handleEncryptedImport = async () => {
    try {
      if (!importText.trim()) {
        setError('Please enter the encrypted chat data');
        return;
      }

      const chatData = await decryptChatData(importText.trim());
      onImport(chatData);
      setImportText('');
      setError('');
      setIsOpen(false);
      if (onSuccess) {
        onSuccess(); // Call the success callback to trigger chat reload
      }
    } catch (err) {
      setError('Failed to import encrypted chat: ' + err.message);
    }
  };

  const fetchDeepSeekResponse = async (messages) => {
    const url = 'https://api.deepseek.com/chat/completions';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.REACT_APP_DEEPSEEK_KEY}`,
    };

    const body = JSON.stringify({
      model: 'deepseek-chat',
      messages,
      stream: false,
    });

    console.log('Sending request to DeepSeek:', { messages });
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    console.log('Raw API response:', data);
    return data.choices[0].message.content;
  };

  const handlePlainTextImport = async () => {
    try {
      if (!importText.trim()) {
        setError('Please enter the text conversation');
        return;
      }

      setIsLoading(true);
      setError('');

      const messages = [
        {
          role: 'system',
          content: `You are a JSON formatting program. Your only job is to take the conversation text and output it as a single JSON string.
          Rules:
          1. ONLY output the JSON string, nothing else
          2. The string must be wrapped in single quotes
          3. Use JSON.stringify format that can be parsed with JSON.parse
          4. Include all messages in chronological order
          5. Detect the role (user/assistant) based on context
          6. Create a relevant title

          Example input:
          User: How's the weather?
          Assistant: It's sunny!
          User: Great!

          Example output (exactly like this):
          '{
            "title": "Weather Chat",
            "messages": [
              {"role": "user", "content": "How's the weather?"},
              {"role": "assistant", "content": "It's sunny!"},
              {"role": "user", "content": "Great!"}
            ]
          }'`
        },
        {
          role: 'user',
          content: importText.trim()
        }
      ];
      const jsonString = await fetchDeepSeekResponse(messages);
      const chatData = extractAndParseJSON(jsonString);

      onImport(chatData);
      setImportText('');
      setError('');
      setIsOpen(false);
      if (onSuccess) {
        onSuccess(); // Call the success callback to trigger chat reload
      }
    } catch (err) {
      setError('Failed to convert text: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SlidePanel title="Import Chat" isOpen={isOpen} setIsOpen={setIsOpen}>
      <div className="import-chat">
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste the chat data here..."
          rows={10}
        />
        {error && <div className="import-error">{error}</div>}
        <div className="import-buttons">
          <button 
            className="import-button"
            onClick={handleJsonImport}
            disabled={!importText.trim() || isLoading}
          >
            Import JSON
          </button>
          <button 
            className="import-button"
            onClick={handleEncryptedImport}
            disabled={!importText.trim() || isLoading}
          >
            Import Encrypted
          </button>
          
          <button 
            className="import-button"
            onClick={handlePlainTextImport}
            disabled={!importText.trim() || isLoading}
          >
            {isLoading ? 'Converting...' : 'Import Plain Text (AI converted)'}
          </button>
        </div>
      </div>
    </SlidePanel>
  );
}

// Encryption/Decryption functions using Web Crypto API
const ENCRYPTION_KEY = 'chat-pwa-secure-key-2024';

async function getKey(password) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('chat-pwa-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptChatData(data) {
  try {
    const key = await getKey(ENCRYPTION_KEY);
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = enc.encode(JSON.stringify(data));

    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encodedData
    );

    // Combine IV and encrypted content
    const encryptedArray = new Uint8Array(iv.length + encryptedContent.byteLength);
    encryptedArray.set(iv);
    encryptedArray.set(new Uint8Array(encryptedContent), iv.length);

    // Convert to base64 for easy copying
    return btoa(String.fromCharCode(...encryptedArray));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt chat data');
  }
}

async function decryptChatData(encryptedString) {
  try {
    // Convert from base64
    const encryptedArray = new Uint8Array(
      atob(encryptedString)
        .split('')
        .map(c => c.charCodeAt(0))
    );

    // Extract IV and encrypted content
    const iv = encryptedArray.slice(0, 12);
    const encryptedContent = encryptedArray.slice(12);

    const key = await getKey(ENCRYPTION_KEY);
    
    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encryptedContent
    );

    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decryptedContent));
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt chat data');
  }
}

export default ImportChat;
