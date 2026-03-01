import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { getInitialTheme, applyTheme } from "./utils/theme";

// This makes sure your app doesn’t flash wrong theme on first load.
const initialTheme = getInitialTheme();
applyTheme(initialTheme);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


