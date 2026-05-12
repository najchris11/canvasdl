/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,tsx,ts}"],
  theme: {
    extend: {
      colors: {
        canvas: {
          red: "#E66000",
          dark: "#2D3B45",
        },
      },
    },
  },
  plugins: [],
};
