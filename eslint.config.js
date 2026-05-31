import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  // Ne pas linter les artefacts de build / dépendances ni la référence wireframe.
  { ignores: ['dist', 'node_modules', 'design/wireframe'] },

  // Code applicatif TypeScript + React (type-aware pour coller au TS strict).
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    // Plugins enregistrés manuellement : leurs presets « flat » ne sont pas
    // compatibles ESLint 10 (plugins en tableau), on ne reprend que les règles.
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json', './tsconfig.e2e.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Toujours en dernier : neutralise les règles ESLint en conflit avec Prettier.
  eslintConfigPrettier,
)
