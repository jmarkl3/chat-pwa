import React from 'react';
import SlidePanel from './SlidePanel';
import './ChatHistory.css';

function ChatHistory({ isOpen, setIsOpen, chats, onSelectChat, currentChatId, onNewChat }) {
  const handleNewChat = () => {
    onNewChat();
    setIsOpen(false);
  };

  return (
    <SlidePanel title="Chat History" isOpen={isOpen} setIsOpen={setIsOpen}>
      <div className="chat-history">
        <button className="new-chat-button" onClick={handleNewChat}>
          + New Chat
        </button>
        <div className="chat-list">
          {Object.entries(chats)
            .sort(([, a], [, b]) => b.timestamp - a.timestamp)
            .map(([chatId, chat]) => {
              const firstMessage = chat.messages[0]?.content || 'Empty chat';
              const isActive = chatId === currentChatId;
              return (
                <div
                  key={chatId}
                  className={`chat-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onSelectChat(chatId);
                    setIsOpen(false);
                  }}
                >
                  <div className="chat-preview">{firstMessage}</div>
                  <div className="chat-timestamp">
                    {new Date(chat.timestamp).toLocaleString()}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </SlidePanel>
  );
}

export default ChatHistory;
