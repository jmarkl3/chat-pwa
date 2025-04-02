import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux';
import { setChatID } from '../../store/idsSlice';
import './AppHome.css'
import Message from './Message'
import { STORAGE_KEY, CHATS_STORAGE_KEY, INACTIVITY_MESSAGE, AVAILABLE_COMMANDS, FORMAT_PREFACE, PROMPT_PREFACE, PROMPT_PREFACE_KEY, DEFAULT_SETTINGS, LONG_TERM_MEMORY_KEY, NOTE_STORAGE_KEY, TEMP_MEMORY_KEY } from './Data'
import { findNumberInArgs, removeSpecialCharacters, ellipsis } from './functions'
import ChatInputArea from './ChatInputArea'

export default function Chat({chatIdRef, scrollToBottom, messages = [], handleSendMessage, settings, speakMessages, isLoading}) {
  const dispatch = useDispatch();
  const { chatID } = useSelector(state => state.main);

  return (
    <div className="app-container">

      <div className="messages-container" id="messages-container">
        {messages.length === 0 && (
          <div className="welcome-box no-select">
            <p>Send a message or just say hi</p>
            <button 
              className="say-hi-button"
              onClick={() => handleSendMessage("hi")}
            >
              Say hi
            </button>
          </div>
        )}
        {(messages && Array.isArray(messages)) && messages?.map((message, index) => (
          <Message
            key={index}
            messageData={message}
            selectedVoice={settings.selectedVoice}
            onSpeakFromHere={() => speakMessages(index)}
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

      
    </div>
  )
}
