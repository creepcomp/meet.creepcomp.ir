import React from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';

const domNode = document.getElementById('app');
const root = createRoot(domNode);

root.render(<App />);
