// KaTeX CSS (with base64 fonts) and the KaTeX script, bundled by react-native-katex.
// Importing them here keeps math rendering fully offline — no CDN, no network.
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const katexStyle: string = require('react-native-katex/build/katex-style').default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const katexScript: string = require('react-native-katex/build/katex-script').default;
