import { fileURLToPath, URL } from 'node:url'
import https from 'node:https'

import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 3010,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET,
          changeOrigin: true,
          // Force IPv4 — this network resolves Cloudflare AAAA records but
          // IPv6 connects time out, which Node surfaces as AggregateError ETIMEDOUT.
          agent: new https.Agent({ family: 4, keepAlive: true }),
          // Keep long-lived SSE connections open (assistant /events streams).
          timeout: 0,
          proxyTimeout: 0,
          configure: (proxy) => {
            // Browser sends Origin: http://localhost:3010. The gateway CORS
            // allowlist rejects it and Express turns that into an HTML 500.
            // This proxy is same-origin to the app, so drop Origin upstream.
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin')
            })
          },
        },
      },
    },
  }
})
