import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setChatID, setListID } from './store/idsSlice';
import Chat from './Routes/App/Chat';
import NestedList from './Routes/NestedList/NestedList';

/*
    This will have the menu in it
    it will have a state variable that determines if the chat or nested list view is showing
    the chatid and loaded nested list wil persist even when switching back and fourth from chat and nested list
*/
function AppContainser() {
    const [componantDisplay, setComponantDisplay] = useState("chat");
    const chatIdRef = useRef(null);
    
    const dispatch = useDispatch();
    const { chatID, listID } = useSelector(state => state.main);

    return (
        <>
            {componantDisplay === "chat" ?
                <Chat
                    chatID={chatID}
                    chatIdRef={chatIdRef}
                    setChatID={(id) => dispatch(setChatID(id))}
                    listID={listID}
                    setListID={(id) => dispatch(setListID(id))}
                />
                :
                <NestedList
                    listID={listID}
                    setListID={(id) => dispatch(setListID(id))}
                />
            }
        </>
    );
}

export default AppContainser;