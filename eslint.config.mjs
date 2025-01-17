import globals from "globals";
import eslint from "@eslint/js";
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import stylistic from '@stylistic/eslint-plugin';

export default [
	{
		ignores: [
			"**/node_modules/",
			".git/",
			"**/*.d.ts",
			"**/*.{json}",
			"*.config.{js,mjs}",
			"dist/",
			"**/*.{min,shim}.js"
		]
	},
	eslint.configs.recommended,
	eslintPluginPrettierRecommended,
	{
		...import('eslint-config-love'),
		files: ["src/**/*.{ts,js}"],
		plugins: {
			'@stylistic': stylistic
		},
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
        projectService: true,
				tsconfigRootDir: import.meta.dirname
			}
		},
		rules: {
			'no-unused-vars': [
				'error',
				{
					args: 'all',
					argsIgnorePattern: '^_',
					caughtErrors: 'all',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					ignoreRestSiblings: true					
				}]
		}
		}];