import { defineConfig } from 'vite-plus'
import path from 'node:path'

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, './src'),
        },
    },

    test: {
        globals: true,
        environment: 'jsdom',
        include: ['src/**/*.test.{ts,tsx}'],
        css: false,
    },

    lint: {
        plugins: ['typescript', 'react', 'react-perf', 'nextjs', 'import', 'unicorn'],
        categories: {
            correctness: 'error',
            suspicious: 'warn',
            pedantic: 'warn',
            perf: 'warn',
            style: 'off',
        },
        rules: {
            'no-unused-vars': 'warn',
            'typescript/no-unused-vars': 'warn',
            'unicorn/prefer-node-protocol': 'error',
            'unicorn/prefer-dom-node-remove': 'warn',
            'import/no-duplicates': 'error',
            'react/no-direct-mutation-state': 'error',
            'react/jsx-no-duplicate-props': 'error',
            'react-perf/jsx-no-new-object-as-prop': 'off',
            'react-perf/jsx-no-new-array-as-prop': 'off',
            'react-perf/jsx-no-new-function-as-prop': 'off',
            'react/react-in-jsx-scope': 'off',
            'import/no-unassigned-import': 'off',
            'import/max-dependencies': ['warn', { max: 20 }],
            'eslint/max-lines-per-function': ['warn', { max: 300 }],
            'eslint/eqeqeq': 'off',
            'eslint/no-inline-comments': 'off',
            'eslint/no-negated-condition': 'off',
            'unicorn/no-negated-condition': 'off',
            'eslint/no-underscore-dangle': ['warn', { allow: ['_tag', '__dirname'] }],
            'eslint/max-lines': ['warn', { max: 350 }],
            'unicorn/prefer-top-level-await': 'off',
            'react-perf/jsx-no-jsx-as-prop': 'off',
            'eslint/max-classes-per-file': ['warn', { max: 100 }],
            'eslint/require-await': 'off',
        },
        ignorePatterns: [
            '.next',
            'out',
            'build',
            'node_modules',
            'src/components/ui',
            'scripts',
            'src/lib/__tests__',
            'src/hooks/__tests__',
        ],
    },

    fmt: {
        semi: false,
        singleQuote: true,
        tabWidth: 4,
        printWidth: 100,
        trailingComma: 'es5',
        ignorePatterns: ['build', 'coverage', 'CLAUDE.md', '.agents', '.claude', 'design-system'],
    },
})
