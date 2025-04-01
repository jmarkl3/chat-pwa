import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Chat from './Routes/App/Chat';
import NestedList from './Routes/NestedList/NestedList';
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
    const [componantDisplay, setComponantDisplay] = useState("chat");
    const chatIdRef = useRef(null);
    const dispatch = useDispatch();
    
    const { chatID, listID } = useSelector(state => state.main);

    // Load settings from localStorage on mount
    useEffect(() => {
        dispatch(loadSettings());
    }, [dispatch]);

    // Update chatIdRef when chatID changes
    useEffect(() => {
        chatIdRef.current = chatID;
        scrollToBottom();
    }, [chatID]);

    // Scroll messages to bottom
    const scrollToBottom = () => {
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
        }
    };

    return (
        <>
            {componantDisplay === "chat" ?
                <Chat
                    chatIdRef={chatIdRef}
                    scrollToBottom={scrollToBottom}
                />
                :
                <NestedList />
            }
        </>
    );
}

export default AppContainser;