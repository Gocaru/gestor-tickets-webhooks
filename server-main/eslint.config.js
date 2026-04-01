// eslint.config.js
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Node.js
        process:         'readonly',
        console:         'readonly',
        AbortController: 'readonly',
        setTimeout:      'readonly',
        clearTimeout:    'readonly',
        fetch:           'readonly',
        URL:             'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef':       'error',
      'eqeqeq':         'error',
      'no-var':         'error',
      'prefer-const':   'warn',
      'no-console':     'off',
    },
  },
  // Globals do Jest — aplicados apenas aos ficheiros de teste
  {
    files: ['src/__tests__/**/*.js'],
    languageOptions: {
      globals: {
        describe:  'readonly',
        test:      'readonly',
        expect:    'readonly',
        beforeAll: 'readonly',
        afterAll:  'readonly',
        afterEach: 'readonly',
        beforeEach:'readonly',
      },
    },
  },
];