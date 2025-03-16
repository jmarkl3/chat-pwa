import React from 'react';
import { Route, HashRouter, Routes } from 'react-router-dom';
import DownloadPage from './Routes/Download/DownloadPage';
import AppHome from './Routes/App/AppHome';
import Landing from './Routes/Landing/Landing';

function App() {
  return (
    <HashRouter>
      <div>
        <div>This is version 1</div>
        <Routes>
          <Route path="/" element={<Landing/>} />
          <Route path="/app" element={<AppHome/>} />
          <Route path="/download" element={<DownloadPage/>} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;