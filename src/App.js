import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './Routes/Landing/Landing';
import AppHome from './Routes/App/AppHome';
import JsonList from './Routes/JsonList/JsonList';
import './App.css';
import NestedList from './Routes/NestedList/NestedList';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<AppHome />} />
        <Route path="/json-list" element={<JsonList />} />
        <Route path="/nested-list" element={<NestedList />} />
      </Routes>
    </Router>
  );
}

export default App;