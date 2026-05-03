import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neife: {
          dark: "#2D3C3C",
          teal: "#5E8B8C",
          brown: "#75524C",
          pink: "#C27F79",
          beige: "#D5C3B6",
          cream: "#F8F7F4",
          yellow: "#F2C94C",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}

export default config
