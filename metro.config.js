const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add Firebase resolver
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  // Add any other modules that need resolving
};

module.exports = config;