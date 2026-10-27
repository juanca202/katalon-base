const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  // El proyecto Katalon guarda sus Test Suites como XML con extensión .ts
  { ignores: ['tests/katalon/**', 'node_modules/**', 'allure-report/**'] },
  js.configs.recommended,
  {
    // Scripts Node auxiliares (conversión a Allure, validaciones de arquitectura)
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
];
