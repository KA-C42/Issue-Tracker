import { defineConfig } from 'eslint/config'
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'

export default defineConfig([
  // Ignore built output
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.vite/**',
      '**/playwright-report/**',
      '**/playwright-results/**',
    ],
  },

  // Base eslint recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // Allow dev-specified unused variables
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
        },
      ],
    },
  },

  // CLIENT (Vite + React) — browser globals + React rules
  {
    files: ['frontend/**/*.{ts,tsx,js,jsx}'],
    // extends: [
    //   reactHooks.configs.flat.recommended,
    //   reactRefresh.configs.vite,
    // ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ['frontend/**/*.{ts,tsx,js,jsx}'],
    ...reactHooks.configs.flat.recommended,
  },
  {
    files: ['frontend/**/*.{ts,tsx,js,jsx}'],
    ...reactRefresh.configs.vite,
  },

  // SERVER (Express) — Node globals
  {
    files: ['backend/**/*.{ts,js}'],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Prevent prettier crossover
  prettier,
])
