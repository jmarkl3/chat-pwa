import React, { useState } from 'react';
import SlidePanel from './SlidePanel';
import './ImportChat.css';

function ImportChat({ isOpen, setIsOpen, onImport }) {
  const [importText, setImportText] = useState('');
  const [error, setError] = useState('');

  const handleImport = async () => {
    try {
      if (!importText.trim()) {
        setError('Please enter the encrypted chat data');
        return;
      }

      // Try to decrypt and parse the chat data
      const chatData = await decryptChatData(importText.trim());
      
      if (!chatData || !chatData.messages || !Array.isArray(chatData.messages)) {
        setError('Invalid chat data format');
        return;
      }

      onImport(chatData);
      setImportText('');
      setError('');
      setIsOpen(false);
    } catch (err) {
      setError('Failed to import chat: ' + err.message);
    }
  };

  return (
    <SlidePanel title="Import Chat" isOpen={isOpen} setIsOpen={setIsOpen}>
      <div className="import-chat">
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste the encrypted chat data here..."
          rows={10}
        />
        {error && <div className="import-error">{error}</div>}
        <button 
          className="import-button"
          onClick={handleImport}
          disabled={!importText.trim()}
        >
          Import
        </button>
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
