import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

const production = process.env.NODE_ENV === 'production'
const pathSrc = path.resolve(__dirname, 'src')

// https://vitejs.dev/config/
export default defineConfig({
  base: production ? '/vue-uploader-solutions-next/' : '/',
  build: {
    outDir: 'docs'
  },
  server: {
    port: 8000,
    open: true
  },
  resolve: {
    alias: {
      '~/': `${pathSrc}/`
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "~/styles/variable.scss" as *;`
      }
    }
  },
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue'],
      resolvers: [ElementPlusResolver()],
      dts: 'src/auto-imports.d.ts'
    }),
    Components({
      resolvers: [
        ElementPlusResolver({
          importStyle: 'sass'
        })
      ],
      dts: 'src/components.d.ts'
    })
  ]
})
