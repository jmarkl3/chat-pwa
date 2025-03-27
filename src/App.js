import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './Routes/Landing/Landing';
import AppHome from './Routes/App/AppHome';
import JsonList from './Routes/JsonList/JsonList';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<AppHome />} />
        <Route path="/json-list" element={<JsonList />} />
      </Routes>
    </Router>
  );
}

export default App;