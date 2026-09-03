const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block macOS resource fork files (._*) — Metro tries to parse them as JS.
config.resolver.blockList = [/.*\/\._.*$/];

module.exports = config;
