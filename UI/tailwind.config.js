/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      },
      colors: {
        canvas: "rgb(var(--canvas-rgb) / <alpha-value>)",
        surface: "rgb(255 255 255 / <alpha-value>)",
        ink: {
          900: "rgb(var(--ink-rgb) / <alpha-value>)",
          700: "#405563",
          500: "#526571",
          300: "#526571",
        },
        primary: {
          50: "#EFF7F6",
          100: "#DCEEEB",
          300: "#8CCBD9",
          500: "#247F83",
          600: "#1B7479",
          700: "rgb(var(--primary-rgb) / <alpha-value>)",
        },
        accent: {
          500: "#2F6FED",
          600: "#2557C7",
        },
        warning: {
          50: "#FFF4E5",
          500: "#F5941F",
          600: "#9A5709",
        },
        danger: {
          50: "#FDECEC",
          500: "#E5484D",
          600: "#C82D33",
        },
      },
      borderRadius: {
        xl2: "1rem",
      },
      boxShadow: {
        card: "0 0 0 1px rgba(23, 43, 58, 0.06), 0 4px 20px -12px rgba(23, 43, 58, 0.1)",
        pop: "0 4px 12px -4px rgba(23, 107, 131, 0.3)",
      },
    },
  },
  plugins: [],
};
