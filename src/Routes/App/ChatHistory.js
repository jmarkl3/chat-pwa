import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setChatID } from '../../store/idsSlice';
import { setComponentDisplay } from '../../store/menuSlice';
import SlidePanel from './SlidePanel';
import ConfirmationBox from './ConfirmationBox';
import ImportChat, { encryptChatData } from './ImportChat';
import './ChatHistory.css';

function ChatHistory({ isOpen, setIsOpen, scrollToBottom }) {
  const [editingChatId, setEditingChatId] = useState(null);
  const [menuOpenChatId, setMenuOpenChatId] = useState(null);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [chats, setChats] = useState([]);

  const dispatch = useDispatch();
  const currentChatId = useSelector(state => state.main.chatID);

  useEffect(() => {
    if (!isOpen) return;
    loadChatsFromStorage();
  }, [isOpen]);

  const loadChatsFromStorage = () => {
    try {
      const chatsStr = localStorage.getItem('chats') || '[]';
      setChats(JSON.parse(chatsStr));
    } catch (error) {
      console.error('Error loading chats:', error);
      setChats([]);
    }
  };

  const handleNewChat = () => {
    dispatch(setChatID(null));
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
    if (e.key === 'Enter') {
      const title = e.target.value.trim();
      if (title) {
        const updatedChats = chats.map(chat => 
          chat.id === chatId ? { ...chat, title } : chat
        );
        localStorage.setItem('chats', JSON.stringify(updatedChats));
        setChats(updatedChats);
        setEditingChatId(null);
      }
    }
  };

  const handleDeleteClick = (e, chatId) => {
    e.stopPropagation();
    setChatToDelete(chatId);
    setMenuOpenChatId(null);
  };

  const handleDeleteConfirm = () => {
    if (!chatToDelete) return;

    // Remove from chats array
    const updatedChats = chats.filter(chat => chat.id !== chatToDelete);
    localStorage.setItem('chats', JSON.stringify(updatedChats));
    setChats(updatedChats);

    // Remove chat data
    localStorage.removeItem(`chat-${chatToDelete}`);

    // If current chat is deleted, clear it
    if (currentChatId === chatToDelete) {
      dispatch(setChatID(null));
    }

    setChatToDelete(null);
  };

  const handleDeleteCancel = () => {
    setChatToDelete(null);
  };

  const handleImportChat = (chatData) => {
    // Save chat data
    localStorage.setItem(`chat-${chatData.id}`, JSON.stringify(chatData));

    // Update chats list
    const newChat = {
      id: chatData.id,
      title: chatData.title || 'Imported Chat',
      timestamp: Date.now()
    };

    const updatedChats = [...chats, newChat];
    localStorage.setItem('chats', JSON.stringify(updatedChats));
    setChats(updatedChats);

    // Switch to new chat
    dispatch(setChatID(chatData.id));
    setShowImport(false);
    setIsOpen(false);
  };

  const handleExportChat = async (chatId) => {
    try {
      const chatData = localStorage.getItem(`chat-${chatId}`);
      if (!chatData) return;

      const chat = JSON.parse(chatData);
      const encryptedData = await encryptChatData(chat);
      await navigator.clipboard.writeText(encryptedData);
      alert('Chat data copied to clipboard!');
    } catch (error) {
      console.error('Error exporting chat:', error);
      alert('Failed to export chat');
    }
  };

  const handleChatSelect = (chatId) => {
    dispatch(setChatID(chatId));
    dispatch(setComponentDisplay("chat"));
    setIsOpen(false);
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  return (
    <>
      <SlidePanel title="Chat History" isOpen={isOpen} setIsOpen={setIsOpen}>
        <div className="chat-history">
          <button className="new-chat-button" onClick={handleNewChat}>New Chat</button>
          <button className="import-chat-button" onClick={() => setShowImport(true)}>Import Chat</button>
          <div className="chat-list">
            {chats.sort((a, b) => b.timestamp - a.timestamp).map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${chat.id === currentChatId ? 'active' : ''}`}
                onClick={() => handleChatSelect(chat.id)}
              >
                <div className="chat-item-content">
                  {editingChatId === chat.id ? (
                    <input
                      type="text"
                      defaultValue={chat.title}
                      onKeyDown={(e) => handleTitleChange(e, chat.id)}
                      onBlur={() => setEditingChatId(null)}
                      autoFocus
                    />
                  ) : (
                    <span className="chat-title">{chat.title || 'Untitled Chat'}</span>
                  )}
                  <button
                    className="chat-menu-button"
                    onClick={(e) => handleMenuClick(e, chat.id)}
                  >
                    ⋮
                  </button>
                </div>
                {menuOpenChatId === chat.id && (
                  <div className="chat-menu">
                    <button onClick={(e) => startEditing(e, chat.id)}>
                      Rename
                    </button>
                    <button onClick={(e) => {
                      e.stopPropagation();
                      handleExportChat(chat.id);
                    }}>
                      Export
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, chat.id)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </SlidePanel>

      {chatToDelete && (
        <ConfirmationBox
          message={`Are you sure you want to delete this chat? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}

      {showImport && (
        <ImportChat
          isOpen={showImport}
          setIsOpen={setShowImport}
          onImport={handleImportChat}
        />
      )}
    </>
  );
}

export default ChatHistory;
