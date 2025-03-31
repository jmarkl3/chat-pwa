import React, { useState, useEffect } from 'react';
import SlidePanel from './SlidePanel';
import ConfirmationBox from './ConfirmationBox';
import ImportChat, { encryptChatData } from './ImportChat';
import './ChatHistory.css';

function ChatHistory({ isOpen, setIsOpen, onSelectChat, currentChatId, onNewChat, onUpdateChat, onDeleteChat, onImportChat }) {
  const [chats, setChats] = useState([]);
  const [editingChatId, setEditingChatId] = useState(null);
  const [menuOpenChatId, setMenuOpenChatId] = useState(null);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [showImport, setShowImport] = useState(false);

  const loadChats = () => {
    try {
      const chatsStr = localStorage.getItem('chats') || '[]';
      const chatsArray = JSON.parse(chatsStr);
      setChats(chatsArray);
    } catch (error) {
      console.error('Error loading chats:', error);
      setChats([]);
    }
  };

  useEffect(()=>{
    if (!isOpen) return;
    loadChats();
  },[isOpen]);

  const handleNewChat = () => {
    onNewChat();
    setIsOpen(false);
  };

  const handleMenuClick = (e, chatId) => {
    e.stopPropagation();
    setMenuOpenChatId(chatId === menuOpenChatId ? null : chatId);
  };

  const startEditing = (e, chatId) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    setMenuOpenChatId(null);
  };

  const handleTitleChange = (e, chatId) => {
    e.stopPropagation();
    const newTitle = e.target.value.trim();
    if (newTitle) {
      // Load current chats
      const chatsStr = localStorage.getItem('chats') || '[]';
      const chatsArray = JSON.parse(chatsStr);
      
      // Find and update the chat
      const chatIndex = chatsArray.findIndex(c => c.id === chatId);
      if (chatIndex !== -1) {
        chatsArray[chatIndex].title = newTitle;
        localStorage.setItem('chats', JSON.stringify(chatsArray));
        loadChats(); // Refresh the list after update
      }
    }
  };

  const handleDuplicate = (e, chatId) => {
    e.stopPropagation();
    const chatData = localStorage.getItem(`chat-${chatId}`);
    if (chatData) {
      onImportChat(JSON.parse(chatData));
    }
    setMenuOpenChatId(null);
    loadChats()
  };

  const handleExport = async (e, chatId) => {
    e.stopPropagation();
    
    try {
      // Load chat data from localStorage
      const chatData = localStorage.getItem(`chat-${chatId}`);
      await navigator.clipboard.writeText(chatData);
      alert('Chat exported and copied to clipboard!');
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export chat');
    }
  };
  const handleExportEncrypted = async (e, chatId) => {
    e.stopPropagation();
    
    try {
      // Load chat data from localStorage
      const chatData = localStorage.getItem(`chat-${chatId}`);
      if (chatData) {
        const parsedChatData = JSON.parse(chatData)
        const encryptedData = await encryptChatData(parsedChatData);
      await navigator.clipboard.writeText(encryptedData);
      alert('Chat exported and copied to clipboard!');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export chat');
    }
  };

  const handleDeleteConfirm = (chatId) => {
    onDeleteChat(chatId);
    setChatToDelete(null);
    loadChats();
  };

  const handleImportChat = (data) => {
    onImportChat(data);
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
            {chats.sort((a, b) => b.timestamp - a.timestamp)
              .map(chat => {
                const isActive = chat.id === currentChatId;
                const isEditing = chat.id === editingChatId;

                return (
                  <div
                    key={chat.id}
                    className={`chat-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (!isEditing) {
                        onSelectChat(chat.id);
                        setIsOpen(false);
                      }
                    }}
                  >
                    <div className="chat-content">
                      {isEditing ? (
                        <div className="chat-edit-form">
                          <input
                            type="text"
                            defaultValue={chat.title || ''}
                            onChange={(e) => handleTitleChange(e, chat.id)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                          <button 
                            type="button" 
                            onClick={() => setEditingChatId(null)}
                            className="edit-complete-button no-sleect"
                          >✓</button>
                        </div>
                      ) : (
                        <>
                          <div className="chat-title">
                            {chat.title || 'Untitled Chat'}
                          </div>
                          <div className="chat-timestamp">
                            {new Date(chat.timestamp).toLocaleString()}
                          </div>
                          <button 
                            className="chat-menu-button" 
                            onClick={(e) => handleMenuClick(e, chat.id)}
                          >
                            ⋮
                          </button>
                          {menuOpenChatId === chat.id && (
                            <div className="chat-menu">
                              <button onClick={(e) => startEditing(e, chat.id)}>
                                Rename
                              </button>
                              <button onClick={(e) => handleDuplicate(e, chat.id)}>
                                Duplicate
                              </button>
                              <button onClick={(e) => {
                                e.stopPropagation();
                                setChatToDelete(chat.id);
                                setMenuOpenChatId(null);
                              }}>
                                Delete
                              </button>
                              <button onClick={(e) => handleExport(e, chat.id)}>
                                Export
                              </button>
                              <button onClick={(e) => handleExportEncrypted(e, chat.id)}>
                                Export Encrypted
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </SlidePanel>
      
      {chatToDelete && (
        <ConfirmationBox
          message={`Delete chat "${chats.find(chat => chat.id === chatToDelete)?.title || 'Untitled'}"?`}
          onConfirm={() => handleDeleteConfirm(chatToDelete)}
          onCancel={() => setChatToDelete(null)}
        />
      )}

      <ImportChat
        isOpen={showImport}
        setIsOpen={setShowImport}
        onImport={handleImportChat}
        onSuccess={() => {
          // Reload chats from localStorage
          const savedChats = localStorage.getItem('chats');
          if (savedChats) {
            setChats(JSON.parse(savedChats));
          }
        }}
      />
    </>
  );
}

export default ChatHistory;
