/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#a83900",
        "primary-container": "#ff7135",
        "on-primary": "#ffffff",
        "on-primary-container": "#601d00",
        "secondary": "#77574d",
        "secondary-container": "#fed3c7",
        "on-secondary-container": "#795950",
        "tertiary": "#006972",
        "tertiary-container": "#00acbb",
        "on-tertiary-container": "#003a3f",
        "surface": "#fbf9f7",
        "on-surface": "#1b1c1b",
        "surface-variant": "#e4e2e0",
        "on-surface-variant": "#59413a",
        "outline": "#8d7169",
        "outline-variant": "#e0bfb6",
        "background": "#fbf9f7",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f5f3f1",
        "surface-container": "#efedec",
        "surface-container-high": "#eae8e6",
        "surface-container-highest": "#e4e2e0",
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
      },
      borderRadius: {
        "xl": "1.5rem",
        "2xl": "2rem",
        "3xl": "2.5rem",
        "full": "9999px",
      },
      fontFamily: {
        headline: ["Plus Jakarta Sans", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
