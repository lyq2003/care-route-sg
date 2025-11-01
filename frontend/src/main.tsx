import { StrictMode } from 'react'
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n"; // Import i18n configuration

/**
 * Application Entry Point
 * 
 * Initializes React application with:
 * - StrictMode for development warnings
 * - Root DOM element mounting
 * - Global CSS and i18n configuration
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
