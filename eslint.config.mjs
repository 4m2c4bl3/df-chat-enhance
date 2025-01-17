import globals from "globals";
import eslint from "@eslint/js";
import tseslint from 'typescript-eslint';
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
			"**/*.min.js"
		]
	},
	eslint.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	eslintPluginPrettierRecommended,
	{
		...import('eslint-config-love'),
		files: ["src/**/*.ts"],
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
		}
		}];