import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import Landing from './Routes/Landing/Landing';
import './App.css';
import NestedList from './Routes/NestedList/NestedList';
import AppContainser from './AppContainser';
import Chat from './Routes/Chat/Chat';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/landing" element={<Landing />} />
          <Route path="/" element={<AppContainser />} />
          <Route path="/Chat" element={<Chat />} />
          <Route path="/nested-list" element={<NestedList />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;