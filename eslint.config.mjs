import { defineConfig } from 'eslint/config'
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'

export default defineConfig([
  // 0) Ignore built output
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

  // 1) Base eslint recommended rules
  js.configs.recommended,

  // 2) TypeScript recommended rules
  ...tseslint.configs.recommended,

  // 3) CLIENT (Vite + React) — browser globals + React rules
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

  // 5) SERVER (Express) — Node globals
  {
    files: ['backend/**/*.{ts,js}'],
    languageOptions: {
      globals: globals.node,
    },
  },

  // 6) Prevent prettier crossover
  prettier,
])
