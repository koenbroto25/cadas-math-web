/**
 * eslint.config.js — Cadas App (flat config, ESLint v9+)
 *
 * Mandiri tanpa dependency tambahan (eslint-config-expo / plugin react tidak
 * terpasang lokal; ESLint dipanggil via installasi global). Ruleset pragmatis:
 * fokus error riil (no-undef, no-dupe-keys, no-unreachable), warning untuk
 * gaya (prefer-const, no-var). Untuk aturan React/React-hooks, tambahkan
 * eslint-plugin-react + eslint-plugin-react-hooks saat koneksi npm tersedia.
 */

// Global lingkungan React Native / Hermes (bukan DOM browser penuh)
const RN_GLOBALS = {
  console: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  setImmediate: 'readonly',
  clearImmediate: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  fetch: 'readonly',
  Headers: 'readonly',
  Request: 'readonly',
  Response: 'readonly',
  FormData: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  AbortController: 'readonly',
  WebSocket: 'readonly',
  Blob: 'readonly',
  File: 'readonly',
  FileReader: 'readonly',
  XMLHttpRequest: 'readonly',
  navigator: 'readonly',
  performance: 'readonly',
  alert: 'readonly',
  process: 'readonly',
  global: 'writable',
  __DEV__: 'readonly',
  __FlipperDefaults: 'readonly',
  HermesInternal: 'readonly',
  require: 'readonly',
  module: 'readonly',
  exports: 'writable',
};

module.exports = [
  {
    ignores: ['node_modules/**', '.expo/**', 'web-build/**', 'android/**', 'ios/**'],
  },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: RN_GLOBALS,
    },
    rules: {
      // ── Error riil ──
      'no-undef': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-unreachable': 'error',
      'no-redeclare': 'error',
      'no-const-assign': 'error',
      'no-fallthrough': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-self-compare': 'error',
      'no-cond-assign': 'error',
      'no-async-promise-executor': 'error',
      'no-await-in-loop': 'off',

      // ── Gaya (warning) ──
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^(React|_)$', caughtErrors: 'none' }],
      'prefer-const': 'warn',
      'no-var': 'warn',
      'eqeqeq': ['warn', 'smart'],
      'no-console': 'off',
      'no-debugger': 'warn',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'object-shorthand': ['warn', 'properties'],
    },
  },
];
