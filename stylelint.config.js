export default {
	extends: ['stylelint-config-standard'],
	ignores: ['node_modules/**', 'dist/**', 'dist-electron/**', 'release/**', 'build/**'],
	rules: {
		'no-descending-specificity': null
	}
};
