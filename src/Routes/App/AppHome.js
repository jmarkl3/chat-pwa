import React, { useState, useRef, useEffect } from 'react'
import './AppHome.css'

function AppHome() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function sendPrompt() {
    const prompt = inputRef.current.value;
    if (!prompt.trim()) return;

    // Add user message
    const newMessage = { role: 'user', content: prompt };
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);
    inputRef.current.value = '';

    // Get previous messages (last 4) plus the new message
    const recentMessages = [...messages.slice(-4), newMessage];

    // Fetch variables
    const url = 'https://api.deepseek.com/chat/completions';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${"sk-6e0ec3f3dc5e42e6b259179411dd2f06"}`,
    };
    const body = JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        ...recentMessages
      ],
      stream: false,
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
      });
      
      const data = await response.json();
      const responseMessage = { role: 'assistant', content: data.choices[0].message.content };
      setMessages(prev => [...prev, responseMessage]);
    } catch (error) {
      const errorMessage = { role: 'assistant', content: 'Sorry, there was an error processing your request.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  };

  return (
    <div className="chat-container">
      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            {message.content}
          </div>
        ))}
        {isLoading && (
          <div className="message assistant loading">
            <div className="loading-dots">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-container">
        <textarea 
          ref={inputRef}
          placeholder="Type your message..."
          onKeyPress={handleKeyPress}
        />
        <button className="submit-button" onClick={sendPrompt}>Send</button>
      </div>
    </div>
  )
}

export default AppHome