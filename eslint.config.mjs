import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import eslint from "@eslint/js";
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import stylistic from '@stylistic/eslint-plugin';

export default [
	eslint.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	eslintPluginPrettierRecommended,
	{
		...import('eslint-config-love'),
		ignores: [
			"**/node_modules/",
			".git/",
			"**/*.d.ts",
			"**/*.{json}",
			"*.{mjs}",
			"dist/"
		],
		files: ["src/**/*.ts"],
		plugins: {
			"@typescript-eslint": typescriptEslint,
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