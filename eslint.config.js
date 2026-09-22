import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import preferArrowFunctions from 'eslint-plugin-prefer-arrow-functions';
import stylistic from '@stylistic/eslint-plugin';
import jsdoc from 'eslint-plugin-jsdoc';

export default [
    {
        ignores: ['node_modules/', 'dist/', 'dist-electron/', 'release/', 'build/']
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['src/**/*.ts', 'src/**/*.tsx', 'types/**/*.ts', 'eslint.config.js'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            }
        },
        plugins: {
            '@stylistic': stylistic,
            jsdoc,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            'prefer-arrow-functions': preferArrowFunctions
        },
        rules: {
            'no-console': 'error',
            'no-var': 'error',
            'prefer-const': 'error',
            'no-trailing-spaces': 'error',
            'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
            'no-multi-spaces': 'error',
            'no-mixed-spaces-and-tabs': 'error',
            'no-duplicate-imports': 'error',
            'no-useless-concat': 'error',
            'prefer-template': 'error',
            'object-shorthand': ['error', 'always'],
            'arrow-spacing': ['error', { before: true, after: true }],
            'space-in-parens': ['error', 'never'],
            'space-before-blocks': ['error', 'always'],
            'keyword-spacing': ['error', { before: true, after: true }],
            'comma-spacing': ['error', { before: false, after: true }],
            'semi': ['error', 'always'],
            'quotes': ['error', 'single'],
            'eol-last': ['error', 'always'],
            'indent': ['error', 4, { SwitchCase: 1 }],
            '@stylistic/spaced-comment': ['error', 'always'],
            '@stylistic/padded-blocks': ['error', 'never'],
            '@stylistic/indent': ['error', 4],
            'padding-line-between-statements': [
                'error',
                { blankLine: 'always', prev: '*', next: 'return' },
                { blankLine: 'always', prev: '*', next: 'try' },
                { blankLine: 'always', prev: '*', next: 'for' },
                { blankLine: 'always', prev: '*', next: 'while' },
                { blankLine: 'always', prev: '*', next: 'if' },
                { blankLine: 'always', prev: '*', next: 'switch' },
                { blankLine: 'always', prev: '*', next: 'function' },
                { blankLine: 'always', prev: '*', next: 'class' },
                { blankLine: 'always', prev: '*', next: 'export' }
            ],
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            'prefer-arrow-functions/prefer-arrow-functions': [
                'error',
                {
                    allowedNames: [],
                    allowNamedFunctions: false,
                    allowObjectProperties: false,
                    classPropertiesAllowed: false,
                    disallowPrototype: false,
                    returnStyle: 'unchanged',
                    singleReturnOnly: false
                }
            ],
            'jsdoc/check-alignment': 'error',
            'jsdoc/check-indentation': 'error',
            'jsdoc/check-line-alignment': ['error', 'always']
        }
    },
    {
        files: ['electron/**/*.ts'],
        languageOptions: {
            globals: globals.node
        },
        plugins: {
            '@stylistic': stylistic,
            jsdoc,
            'prefer-arrow-functions': preferArrowFunctions
        },
        rules: {
            'comma-dangle': ['error', 'never'],
            'no-console': 'error',
            'no-var': 'error',
            'prefer-const': 'error',
            'no-trailing-spaces': 'error',
            'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
            'no-multi-spaces': 'error',
            'no-mixed-spaces-and-tabs': 'error',
            'no-duplicate-imports': 'error',
            'no-useless-concat': 'error',
            'prefer-template': 'error',
            'object-shorthand': ['error', 'always'],
            'arrow-spacing': ['error', { before: true, after: true }],
            'space-in-parens': ['error', 'never'],
            'space-before-blocks': ['error', 'always'],
            'keyword-spacing': ['error', { before: true, after: true }],
            'comma-spacing': ['error', { before: false, after: true }],
            'semi': ['error', 'always'],
            'quotes': ['error', 'single'],
            'eol-last': ['error', 'always'],
            'indent': ['error', 4, { SwitchCase: 1 }],
            '@stylistic/spaced-comment': ['error', 'always'],
            '@stylistic/padded-blocks': ['error', 'never'],
            '@stylistic/indent': ['error', 4],
            'padding-line-between-statements': [
                'error',
                { blankLine: 'always', prev: '*', next: 'return' },
                { blankLine: 'always', prev: '*', next: 'try' },
                { blankLine: 'always', prev: '*', next: 'for' },
                { blankLine: 'always', prev: '*', next: 'while' },
                { blankLine: 'always', prev: '*', next: 'if' },
                { blankLine: 'always', prev: '*', next: 'switch' },
                { blankLine: 'always', prev: '*', next: 'function' },
                { blankLine: 'always', prev: '*', next: 'class' },
                { blankLine: 'always', prev: '*', next: 'export' }
            ],
            'prefer-arrow-functions/prefer-arrow-functions': [
                'error',
                {
                    allowedNames: [],
                    allowNamedFunctions: false,
                    allowObjectProperties: false,
                    classPropertiesAllowed: false,
                    disallowPrototype: false,
                    returnStyle: 'unchanged',
                    singleReturnOnly: false
                }
            ],
            'jsdoc/check-alignment': 'error',
            'jsdoc/check-indentation': 'error',
            'jsdoc/check-line-alignment': ['error', 'always']
        }
    }
];
