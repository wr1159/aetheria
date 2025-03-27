/** @type {import('tailwindcss').Config} */
export const content = ["./src/**/*.{js,jsx,ts,tsx}"];
export const theme = {
    extend: {
        colors: {
            rpg: {
                // https://www.color-hex.com/color-palette/1057231
                primary: "#F0C17F", // Cream
                secondary: "#2b3a4f", // Dark Blue
                accent: "#c87318", // Orange
                background: "#2C1810", // Dark Brown
                text: "#F5DEB3", // Wheat
            },
        },
        fontFamily: {
            pixel: ["Press Start 2P", "cursive"],
        },
        boxShadow: {
            pixel: "4px 4px 0px 0px rgba(0, 0, 0, 0.2)",
        },
        animation: {
            summon: "summon 1s ease-in-out",
        },
        keyframes: {
            summon: {
                "0%": { transform: "scale(0) rotate(0deg)", opacity: "0" },
                "50%": {
                    transform: "scale(1.2) rotate(180deg)",
                    opacity: "1",
                },
                "100%": {
                    transform: "scale(1) rotate(360deg)",
                    opacity: "1",
                },
            },
        },
    },
};
export const plugins = [];
