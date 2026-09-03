const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  // A config block with only `ignores` applies globally; combined with other
  // keys it would only scope that one block.
  { ignores: ['dist/**', '.expo/**', 'android/**', 'ios/**', '**/._*'] },
  expoConfig,
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);
