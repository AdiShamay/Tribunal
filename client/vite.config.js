const { defineConfig } = require('vite');

const apiProxyTarget = process.env.API_PROXY_TARGET;

module.exports = defineConfig({
  server: {
    ...(apiProxyTarget ? {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true
        }
      }
    } : {})
  }
});
