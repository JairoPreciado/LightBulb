const { getDefaultConfig } = require('@expo/metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);
  // Agrega 'bin' a la lista de extensiones de asset
  config.resolver.assetExts.push('bin');
  return config;
})();
