import React, { useState } from 'react';
import SlidePanel from './SlidePanel';
import ConfirmationBox from './ConfirmationBox';
import ImportChat, { encryptChatData } from './ImportChat';
import './ChatHistory.css';

function ChatHistory({ isOpen, setIsOpen, chats, onSelectChat, currentChatId, onNewChat, onUpdateChat, onDeleteChat, onImportChat }) {
  const [renamingChat, setRenamingChat] = useState(null);
  const [menuOpenChatId, setMenuOpenChatId] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [showImport, setShowImport] = useState(false);

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
    setRenamingChat({ id: chatId, title: currentTitle });
    setMenuOpenChatId(null);
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    if (newTitle.trim() && renamingChat) {
      const chat = chats[renamingChat.id];
      onUpdateChat(renamingChat.id, { 
        title: newTitle.trim(),
        messages: chat.messages || [], 
        timestamp: Date.now()
      });
    }
  };

  const handleExport = async (e, chatId) => {
    e.stopPropagation();
    setMenuOpenChatId(null);
    
    try {
      const chatData = chats[chatId];
      const encryptedData = await encryptChatData(chatData);
      await navigator.clipboard.writeText(encryptedData);
      alert('Chat exported and copied to clipboard!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export chat');
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
          <button className="import-chat-button" onClick={() => setShowImport(true)}>
            Import Chat
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
                      if (renamingChat?.id !== chatId) {
                        onSelectChat(chatId);
                        setIsOpen(false);
                      }
                    }}
                  >
                    {renamingChat?.id === chatId ? (
                      <div className="chat-edit-form">
                        <input
                          type="text"
                          className="rename-input"
                          value={renamingChat.title}
                          onChange={(e) => {
                            setRenamingChat({ ...renamingChat, title: e.target.value });
                            handleTitleChange(e);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                        <button 
                          className="confirm-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingChat(null);
                          }}
                        >
                          ✓
                        </button>
                      </div>
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
                            <button onClick={(e) => handleExport(e, chatId)}>
                              Export
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

      <ImportChat
        isOpen={showImport}
        setIsOpen={setShowImport}
        onImport={onImportChat}
      />
    </>
  );
}

export default ChatHistory;
