import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                mint: resolve(__dirname, "mint/index.html"),
            },
        },
    },
});
