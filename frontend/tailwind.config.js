/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        bg: "#0f1722",
        surface: "#141c29",
        panel: "#18212f",
        line: "#2b3748",
        signal: "#2dd4bf",
        accent: "#2dd4bf",
        warn: "#f59e0b",
        danger: "#fb7185"
      }
    }
  },
  plugins: []
};
