module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
  ],
  rules: {
    "quotes": ["error", "double"],
    "indent": ["error", 2],
    "max-len": ["error", { "code": 120 }],
    "object-curly-spacing": ["error", "always"],
    "comma-dangle": ["error", "always-multiline"],
    "arrow-parens": ["error", "always"],
    "no-var": "error",
    "one-var": "error",
    "brace-style": ["error", "1tbs"],
    "spaced-comment": ["error", "always"],
    "eol-last": ["error", "always"],
    "camelcase": "off",
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
};
