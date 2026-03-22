const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,
  {
    files: ["*.js"],
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "off",
    },
  },
  {
    ignores: ["node_modules/", "worker-bundle.js"],
  },
];
