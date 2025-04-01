import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Chat from './Routes/App/Chat';
import NestedList from './Routes/NestedList/NestedList';
import Menu from './Routes/App/Menu';
import { loadSettings } from './store/menuSlice';

/*
    This will have the menu in it
    it will have a state variable that determines if the chat or nested list view is showing
    the chatid and loaded nested list wil persist even when switching back and fourth from chat and nested list

    todo:

    put list id in redux so it persists
        and make it so when tha changes the ref in chat updates so it is always accessed before the fetch
    test taht switching back and fourth from chat and list they are both staying the same chat id and list id    
    
    put menu int app container so settings are available in both
    add setting for enter to create new list item

    organize files
    remove unused files

*/
function AppContainser() {
    const chatIdRef = useRef(null);
    const dispatch = useDispatch();
    
    const { chatID, listID } = useSelector(state => state.main);
    const { componentDisplay } = useSelector(state => state.menu);

    // Load settings from localStorage on mount
    useEffect(() => {
        const storedSettings = localStorage.getItem('settings');
        if (storedSettings) {
            try {
                const settings = JSON.parse(storedSettings);
                dispatch(loadSettings(settings));
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        }
    }, [dispatch]);

    // Update chatIdRef when chatID changes
    useEffect(() => {
        chatIdRef.current = chatID;
        scrollToBottom();
    }, [chatID]);

    // Scroll messages to bottom
    const scrollToBottom = () => {
        const element = document.querySelector('.message-list');
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    };

    return (
        <div className="app-container">
            <Menu />
            {componentDisplay === "chat" ?
                <Chat
                    chatIdRef={chatIdRef}
                    scrollToBottom={scrollToBottom}
                />
                :
                componentDisplay === "list" ?
                    <NestedList />
                    :
                    <div>Error: Unknown component</div>
            }
        </div>
    );
}

export default AppContainser;