const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block macOS resource fork files (._*) — Metro tries to parse them as JS.
// Block the docs/ folder — mega.json lives there and must not be bundled into the APK.
config.resolver.blockList = [/.*\/\._.*$/, /.*\/docs\/.*/];

// Exclude web-only packages from Android/iOS bundles.
// react-native-web and react-dom have no function in a native APK and add ~15 MB.
const originalResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform !== 'web' && (moduleName === 'react-native-web' || moduleName === 'react-dom')) {
    return { type: 'empty' };
  }
  if (originalResolver) return originalResolver(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
