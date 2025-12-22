import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import GematriaApp from './GematriaApp';
import './App.css'; 

const App = () => {
  return (
    <Router>
      <Routes>
        {/* The Root URL (Landing Page) */}
        <Route path="/" element={<LandingPage />} />
        
        {/* The Gematria App URL */}
        <Route path="/gematria" element={<GematriaApp />} />
      </Routes>
    </Router>
  );
};

export default App;