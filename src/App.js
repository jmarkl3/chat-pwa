import React from 'react';
import { Route, HashRouter, Routes } from 'react-router-dom';
import DownloadPage from './Routes/Download/DownloadPage';
import AppHome from './Routes/App/AppHome';
import Landing from './Routes/Landing/Landing';
import AmazonSTT from './Routes/App/AmazonSTT';

function App() {
  return (
    <HashRouter>
      <div>
        <Routes>
          <Route path="/" element={<AppHome/>} />
          <Route path="/landing" element={<Landing/>} />
          <Route path="/amazonSTT" element={<AmazonSTT  />} />
          <Route path="/download" element={<DownloadPage/>} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;