import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import Chat from './Routes/App/Chat';
import NestedList from './Routes/NestedList/NestedList';

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
    const [showMenu, setShowMenu] = useState();
    const chatIdRef = useRef(null);
    
    const { chatID, listID } = useSelector(state => state.main);

    return (
        <>
            {componantDisplay === "chat" ?
                <Chat
                    chatIdRef={chatIdRef}
                />
                :
                <NestedList />
            }
        </>
    );
}

export default AppContainser;