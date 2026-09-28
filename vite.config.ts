import { fileURLToPath, URL } from 'node:url'
import http from 'node:http'
import https from 'node:https'

import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

function isDirectUserServiceTarget(target: string): boolean {
  try {
    const { hostname, port } = new URL(target)
    const isLocalHost =
      hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
    return isLocalHost && (port === '5000' || port === '')
  } catch {
    return false
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.PROXY_TARGET || 'http://localhost:5000'
  const isHttpsTarget = /^https:/i.test(proxyTarget)
  // user-service mounts at /assistant; gateway expects /api/v1/user/assistant.
  // When PROXY_TARGET is user-service :5000, strip the gateway prefix.
  const proxyToUserService = isDirectUserServiceTarget(proxyTarget)

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
          target: proxyTarget,
          changeOrigin: true,
          rewrite: proxyToUserService
            ? (path) => path.replace(/^\/api\/v1\/user/, '') || '/'
            : undefined,
          // Force IPv4 — this network resolves Cloudflare AAAA records but
          // IPv6 connects time out, which Node surfaces as AggregateError ETIMEDOUT.
          // Use http.Agent for local http:// targets (https.Agent rejects them).
          agent: isHttpsTarget
            ? new https.Agent({ family: 4, keepAlive: true })
            : new http.Agent({ family: 4, keepAlive: true }),
          // Keep long-lived SSE connections open (assistant /events streams).
          timeout: 0,
          proxyTimeout: 0,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin')
              // Discourage proxy buffering of SSE.
              proxyReq.setHeader('Accept', 'text/event-stream')
              proxyReq.setHeader('Cache-Control', 'no-cache')
            })
            proxy.on('proxyRes', (proxyRes, _req, res) => {
              const contentType = proxyRes.headers['content-type'] ?? ''
              if (!String(contentType).includes('text/event-stream')) return

              res.setHeader('Cache-Control', 'no-cache, no-transform')
              res.setHeader('X-Accel-Buffering', 'no')
              delete proxyRes.headers['content-length']
              delete proxyRes.headers['content-encoding']
            })
          },
        },
      },
    },
  }
})
