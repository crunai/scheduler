module.exports = {
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  plugins: ["@stylistic"],
  ignorePatterns: ["**/*.cjs"],
  rules: {
    eqeqeq: ["error", "always"],
  },
};
