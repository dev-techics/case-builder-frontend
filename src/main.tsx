import ReactDom from 'react-dom/client';
import { Provider } from 'react-redux';
import './index.css'; // Tailwind entry
import React from 'react';
import { pdfjs } from 'react-pdf';
import App from './App';
import store from './app/store';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

ReactDom.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
