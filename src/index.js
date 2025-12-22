import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

console.log("Sanity Check: index.js is running!");

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <div style={{ backgroundColor: 'red', color: 'white', padding: '50px', fontSize: '30px' }}>
    <h1>SYSTEM STATUS: ONLINE</h1>
    <p>If you see this, React is working.</p>
    <p>The issue is inside App.js or LandingPage.js</p>
  </div>
);