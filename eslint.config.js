import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['dist', '.wrangler', 'node_modules', 'migrations'] },
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                },
            ],
            '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
        },
    },
    {
        files: ['src/**/*.{ts,tsx}'],
        languageOptions: { globals: globals.browser },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        },
    },
    {
        files: ['**/*.{js,mjs}'],
        ...tseslint.configs.disableTypeChecked,
        languageOptions: {
            ...tseslint.configs.disableTypeChecked.languageOptions,
            globals: globals.node,
        },
    },
    // shadcn/ui generated components: kept as vendored code so `shadcn add` updates apply cleanly.
    {
        files: [
            'src/components/ui/{avatar,button,dialog,dropdown-menu,input,separator,sheet,sidebar,skeleton,sonner,tooltip}.tsx',
            'src/hooks/use-mobile.ts',
        ],
        rules: {
            'react-refresh/only-export-components': 'off',
            'react-hooks/purity': 'off',
            'react-hooks/set-state-in-effect': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
        },
    },
    prettier,
    // Re-enabled after eslint-config-prettier: object literals with 2+ props go one prop per line.
    // Destructuring is left to Prettier, which always collapses patterns and would fight this rule.
    {
        plugins: { '@stylistic': stylistic },
        rules: {
            '@stylistic/object-curly-newline': [
                'error',
                {
                    ObjectExpression: {
                        minProperties: 2,
                        multiline: true,
                    },
                },
            ],
            '@stylistic/object-property-newline': [
                'error',
                { allowAllPropertiesOnSameLine: false },
            ],
        },
    },
);
