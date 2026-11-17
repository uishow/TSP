import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const HERE = __dirname
// 时间轴组件原样复制，内部 import '@/lib/api' 与 '@/lib/cn'；用 alias 指向本工程适配层。
const API_ADAPTER = path.resolve(HERE, 'src/api.ts')
const CN_ADAPTER = path.resolve(HERE, 'src/cn.ts')

export default defineConfig({
  root: HERE,
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  resolve: {
    alias: {
      '@/lib/api': API_ADAPTER,
      '@/lib/cn': CN_ADAPTER,
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    minify: 'esbuild',
    target: 'es2020',
    lib: {
      entry: path.resolve(HERE, 'entry.tsx'),
      formats: ['es'],
      fileName: () => 'bundle.js',
    },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})
