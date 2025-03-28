import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import MintPage from "./Mint";
import { AppKitProvider } from "./components/AppkitProvider";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <AppKitProvider>
            <MintPage />
        </AppKitProvider>
    </StrictMode>
);
