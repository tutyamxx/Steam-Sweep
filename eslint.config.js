import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
	{
		ignores: ['node_modules/', 'dist/', 'dist-electron/', 'release/', 'build/']
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ['src/**/*.{ts,tsx}'],
		languageOptions: {
			globals: globals.browser
		},
		plugins: {
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh
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
			'padding-line-between-statements': ['error', { blankLine: 'always', prev: '*', next: 'return' }],
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
			'react-refresh/only-export-components': ['warn', { allowConstantExport: true }]
		}
	},
	{
		files: ['electron/**/*.ts'],
		languageOptions: {
			globals: globals.node
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
			'indent': ['error', 4, { SwitchCase: 1 }]
		}
	}
];
