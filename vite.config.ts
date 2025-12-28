import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// 原生Vite插件集成后端
function backendPlugin() {
  return {
    name: 'backend-server',
    async configureServer(server: any) {
      console.log('[Vite] 配置后端服务器...')

      // 导入 app
      const { default: app } = await import('./src/server/app.ts')

      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url?.startsWith('/api') || req.url === '/health') {
          app(req, res, next)
        } else {
          next()
        }
      })

      console.log('[Vite] 后端服务器配置完成')
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), backendPlugin()],
    server: {
      port: 5173,
      host: true
    },
    define: {
      'import.meta.env.VITE_APP_ID': JSON.stringify(env.VITE_APP_ID),
      'import.meta.env.VITE_APP_SECRET': JSON.stringify(env.VITE_APP_SECRET)
    }
  }
})
