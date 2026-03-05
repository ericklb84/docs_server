import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { applyTheme, getStoredTheme } from "./storage";
import App from "./App";
import "./index.css";

applyTheme(getStoredTheme());

const root = document.getElementById("root");
if (!root) throw new Error("No root element");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
