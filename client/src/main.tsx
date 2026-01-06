import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./i18n";
import "./index.css";

// Ensure React is available before rendering
if (typeof React === 'undefined') {
  throw new Error('React is not properly loaded. Please check your dependencies.');
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Root element not found. Make sure you have a <div id="root"></div> in your HTML.');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
