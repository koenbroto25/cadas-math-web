// metro.config.js — FASE 9: SVG support via react-native-svg
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add SVG to asset extensions so require() works for .svg files
config.resolver.assetExts.push('svg');

// Use react-native-svg-transformer for SVG files
const { transformer, resolver } = config;
config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};
config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'svg'],
};

module.exports = config;
