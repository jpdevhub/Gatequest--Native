const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Block macOS resource fork files (._*) — Metro tries to parse them as JS
config.resolver.blockList = [/.*\/\._.*$/];

module.exports = withNativeWind(config, { input: './global.css' });
