// metro.config.js — FASE 9: SVG support via react-native-svg
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const { transformer, resolver } = config;

// SVG: pakai SVGR transformer (bukan asset)
config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};
config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'svg'],
  // Paksa Expo web pakai file .web.js dari react-native-svg
  // (v15 tidak punya "web" field di package.json exports)
  resolveRequest: (context, moduleName, platform) => {
    if (
      platform === 'web' &&
      (moduleName === 'react-native-svg' || moduleName.startsWith('react-native-svg/'))
    ) {
      const suffix = moduleName === 'react-native-svg'
        ? 'lib/commonjs/ReactNativeSVG.web.js'
        : moduleName.replace('react-native-svg/', '') + '.web.js';
      try {
        const resolved = require.resolve(
          path.join(__dirname, 'node_modules/react-native-svg', suffix)
        );
        return { filePath: resolved, type: 'sourceFile' };
      } catch (_) {}
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;