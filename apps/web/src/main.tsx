import { registerSW } from "virtual:pwa-register";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./style.css";

registerSW({ onOfflineReady: () => window.dispatchEvent(new Event("cubo-offline-ready")) });
const root = document.getElementById("root");
if (root)
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
