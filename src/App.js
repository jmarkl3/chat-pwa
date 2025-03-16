import React, { useState } from 'react';
import { Route, BrowserRouter, Routes } from 'react-router-dom';
import DownloadPage from './Routes/Download/DownloadPage';
import AppHome from './Routes/App/AppHome';
import Landing from './Routes/Landing/Landing';

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<AppHome/>} />
          <Route path="/download" element={<DownloadPage/>} />
        </Routes>
      </BrowserRouter>
      </div>
  );
}

export default App;