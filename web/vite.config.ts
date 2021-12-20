import type { UserConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import comlink from 'vite-plugin-comlink';
import worker, { pluginHelper } from 'vite-plugin-worker';

const config: UserConfig = {
   plugins: [
      (comlink as any).default({ typeFile: './src/comlink-workers.d.ts' }),
      pluginHelper(),
      (worker as any).default({}),
      vue()
   ],
   resolve: {
      alias: {
         '@/': '/src/',
         '@core/': '/../core/'
      }
   },
   build: {
      //Defaults to 500 but firebase itself is about 475.
      chunkSizeWarningLimit: 600
   },
   server: {
      host: '0.0.0.0',
      proxy: {
         '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
         },
         '/ws': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            ws: true
         }
      }
   }
};

export default config;