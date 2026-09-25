import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./public/wedding-body.html",
    "./index.html",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          cream: "#FAF7F2",
          creamDark: "#F2ECE1",
          dark: "#0F0F0F",
          onyx: "#0A0A0A",
          border: "#E2DCD2",
          plum: "#542344",
          plumLight: "#73335D",
          plumDark: "#3A152E",
          green: "#042B1D",
          greenLight: "#E8EFE9",
          sage: "#8FA88B",
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "serif"],
        sans: ['"Plus Jakarta Sans"', "sans-serif"],
        amp: ['"Pinyon Script"', "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;
