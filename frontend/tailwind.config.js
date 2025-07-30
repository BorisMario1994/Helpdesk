export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    {
      pattern: /(bg|text|border)-(red|blue|green|yellow|purple|gray)-(100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /hover:(bg|text)-(red|blue|green|yellow|purple|gray)-(100|200|300|400|500|600|700|800|900)/,
    },
  ],
  theme: {
    extend: {
      fontFamily: {
        roboto: ["Roboto", "sans-serif"],
        "open-sans": ["Open-Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
