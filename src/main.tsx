import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { initPalette } from '@/utils/palette';
import App from './App';
import './index.css';

// Apply saved colour palette before first render so there's no flash
initPalette();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontSize: '13px',
            borderRadius: '8px',
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
