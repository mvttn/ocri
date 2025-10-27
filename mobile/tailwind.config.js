/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#1E1E1E",
        primary: "#4E9FFF",
        accent: "#5EEAD4",
        secondary: "#E0E3E7",
      },
      fontFamily: {
        primary: ["Inter", "sans-serif"],
        heading: ["Syne", "sans-serif"],
      },
    },
    plugins: [],
  },
};
