module.exports = {
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  singleQuote: false,
  liquidSingleQuote: true,
  htmlWhitespaceSensitivity: "css",
  singleLineLinkTags: false,
  indentSchema: false,
  plugins: [require("@shopify/prettier-plugin-liquid"), require("prettier-plugin-tailwindcss")],
};
