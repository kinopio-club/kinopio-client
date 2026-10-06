import pluginVue from 'eslint-plugin-vue'
import standard from '@vue/eslint-config-standard'
import babelParser from '@babel/eslint-parser'
import globals from 'globals'

export default [
  {
    ignores: [
      'src/polyfills/*',
      'src/libs/*'
    ]
  },
  ...pluginVue.configs['flat/recommended'],
  ...standard,
  {
    files: ['**/*.js', '**/*.vue'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser
      },
      parserOptions: {
        parser: babelParser,
        requireConfigFile: false,
        babelOptions: {
          plugins: [
            'transform-es2015-modules-commonjs'
          ]
        }
      }
    },
    rules: {
      'no-throw-literal': 'off',
      'no-unused-vars': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/no-reserved-component-names': 'off',
      'vue/require-default-prop': 'off',
      'array-callback-return': 'off',
      'prefer-regex-literals': 'off'
    }
  }
]
