const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for Node.js core modules
config.resolver.extraNodeModules = {
  stream: require.resolve('readable-stream'),
  crypto: require.resolve('react-native-crypto'),
  buffer: require.resolve('buffer/'),
  util: require.resolve('util/'),
  process: require.resolve('process/browser'),
  assert: require.resolve('assert/'),
  fs: false,
  path: false,
  zlib: false,
  http: false,
  https: false,
  os: false,
  net: false,
  tls: false,
  child_process: false,
  dns: false,
  dgram: false,
};

// Create a mock WebSocket module
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'ws' || moduleName.startsWith('ws/')) {
    return {
      filePath: require.resolve('./mocks/ws-mock.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config; 