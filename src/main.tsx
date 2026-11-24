import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { AuthProvider } from "./state/Auth";
import { CollectionProvider } from "./state/Collection";
import App from "./App";
import "./styles.css";
import "./painted.css";
import "./desert-hero.css";
import "./components/organizer.css";
import "./desert-pages.css";
import "./mobile.css";
import { HummingProvider } from "./state/Humming";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CollectionProvider>
          <HummingProvider>
            <MotionConfig reducedMotion="user">
              <App />
            </MotionConfig>
          </HummingProvider>
        </CollectionProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

if (import.meta.env.PROD && window.isSecureContext && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch((error) => {
      console.warn("Could not enable offline access.", error);
    });
  }, { once: true });
}
