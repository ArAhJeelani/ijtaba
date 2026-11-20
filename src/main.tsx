import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CollectionProvider } from "./state/Collection";
import App from "./App";
import "./styles.css";
import "./painted.css";
import "./desert-hero.css";
import { HummingProvider } from "./state/Humming";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <CollectionProvider>
        <HummingProvider>
          <App />
        </HummingProvider>
      </CollectionProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

import './components/organizer.css';
