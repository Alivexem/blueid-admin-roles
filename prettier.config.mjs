/** @type {import("prettier").Config} */
const config = {
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindStylesheet: "./src/styles/globals.css",
  tailwindFunctions: ["cn", "cva"],
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 80,
};

export default config;
