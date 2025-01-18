import globals from "globals";
import eslint from "@eslint/js";
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

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
		files: ["src/**/*.{ts,js}"],
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
        projectService: true,
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