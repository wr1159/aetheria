import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import MintPage from "./Mint";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <MintPage />
    </StrictMode>
);
