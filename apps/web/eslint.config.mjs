import prettier from 'eslint-config-prettier/flat';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import globals from 'globals';

const config = [
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/next-env.d.ts',
    ],
  },
  prettier,
  { files: ['**/*.mjs'], languageOptions: { globals: globals.node } },
];

export default config;
