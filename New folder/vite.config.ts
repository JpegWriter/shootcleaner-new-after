import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'node14',
    rollupOptions: {
      external: [
        'fs',
        'path',
        'fs/promises',
        'node:fs',
        'node:path',
        'node:util',
        'node:stream',
        'node:events',
        'node:os',
        'node:crypto',
        'node:child_process',
        'child_process',
        'sharp',
        'electron',
        'util',
        'os',
        'crypto',
        'stream',
        'events'
      ],
      output: {
        globals: {
          'fs': 'require("fs")',
          'path': 'require("path")',
          'fs/promises': 'require("fs").promises',
          'sharp': 'require("sharp")',
          'child_process': 'require("child_process")',
          'util': 'require("util")',
          'os': 'require("os")',
          'crypto': 'require("crypto")',
          'stream': 'require("stream")',
          'events': 'require("events")'
        }
      }
    }
  },
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
    host: 'localhost',
    strictPort: true,  // Exit if port is already in use
  },
})
