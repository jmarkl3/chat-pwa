import React, { useState } from 'react';
import SlidePanel from './SlidePanel';
import ConfirmationBox from './ConfirmationBox';
import './ChatHistory.css';

function ChatHistory({ isOpen, setIsOpen, chats, onSelectChat, currentChatId, onNewChat, onUpdateChat, onDeleteChat }) {
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [menuOpenChatId, setMenuOpenChatId] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  const handleNewChat = () => {
    onNewChat();
    setIsOpen(false);
  };

  const handleMenuClick = (e, chatId) => {
    e.stopPropagation();
    setMenuOpenChatId(chatId === menuOpenChatId ? null : chatId);
  };

  const startEditing = (e, chatId, currentTitle) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
    setMenuOpenChatId(null);
  };

  const handleRename = (e, chatId) => {
    e.preventDefault();
    if (editingTitle.trim()) {
      onUpdateChat(chatId, { title: editingTitle.trim() });
      setEditingChatId(null);
    }
  };

  const confirmDelete = (e, chatId) => {
    e.stopPropagation();
    setChatToDelete(chatId);
    setShowConfirmation(true);
    setMenuOpenChatId(null);
  };

  const handleDelete = () => {
    if (chatToDelete) {
      onDeleteChat(chatToDelete);
      setShowConfirmation(false);
      setChatToDelete(null);
    }
  };

  return (
    <>
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
                const isEditing = chatId === editingChatId;

                return (
                  <div
                    key={chatId}
                    className={`chat-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (!isEditing) {
                        onSelectChat(chatId);
                        setIsOpen(false);
                      }
                    }}
                  >
                    {isEditing ? (
                      <form onSubmit={(e) => handleRename(e, chatId)} className="chat-edit-form">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          onBlur={(e) => handleRename(e, chatId)}
                        />
                      </form>
                    ) : (
                      <>
                        <div className="chat-preview">{chat.title || firstMessage}</div>
                        <div className="chat-timestamp">
                          {new Date(chat.timestamp).toLocaleString()}
                        </div>
                        <button 
                          className="chat-menu-button" 
                          onClick={(e) => handleMenuClick(e, chatId)}
                        >
                          ⋮
                        </button>
                        {menuOpenChatId === chatId && (
                          <div className="chat-menu">
                            <button onClick={(e) => startEditing(e, chatId, chat.title || firstMessage)}>
                              Rename
                            </button>
                            <button onClick={(e) => confirmDelete(e, chatId)}>
                              Delete
                            </button>
                            <button onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenChatId(null);
                            }}>
                              Cancel
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </SlidePanel>
      
      {showConfirmation && (
        <ConfirmationBox
          message={`Delete chat "${chats[chatToDelete]?.title || 'Untitled'}"?`}
          onConfirm={handleDelete}
          onCancel={() => {
            setShowConfirmation(false);
            setChatToDelete(null);
          }}
        />
      )}
    </>
  );
}

export default ChatHistory;
