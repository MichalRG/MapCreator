const sharedRules = {
  curly: ["error", "all"],
  eqeqeq: ["error", "always"],
  "no-constant-condition": ["error", { checkLoops: false }],
  "no-dupe-args": "error",
  "no-dupe-keys": "error",
  "no-redeclare": "error",
  "no-undef": "error",
  "no-unreachable": "error",
  "no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrors: "all", caughtErrorsIgnorePattern: "^_" }],
  "object-shorthand": ["error", "always"],
  "prefer-const": "error",
  "valid-typeof": "error"
};

export default [
  {
    ignores: ["coverage/**", "node_modules/**", "public/**"]
  },
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        Blob: "readonly",
        FileReader: "readonly",
        HTMLInputElement: "readonly",
        HTMLSelectElement: "readonly",
        HTMLTextAreaElement: "readonly",
        Image: "readonly",
        URL: "readonly",
        console: "readonly",
        document: "readonly",
        requestAnimationFrame: "readonly",
        setTimeout: "readonly",
        window: "readonly"
      }
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error"
    },
    rules: sharedRules
  },
  {
    files: ["server.mjs", "tests/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly"
      }
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error"
    },
    rules: sharedRules
  }
];
