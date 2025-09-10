import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.MASTER_PASSWORD': JSON.stringify(env.MASTER_PASSWORD || '940831')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      publicDir: 'public',
      assetsInclude: ['**/*.mp3', '**/*.wav', '**/*.ogg'],
      server: {
        port: parseInt(process.env.PORT || '8080'),
        host: '0.0.0.0'
      },
      preview: {
        port: parseInt(process.env.PORT || '8080'),
        host: '0.0.0.0'
      },
      build: {
        copyPublicDir: true,
        assetsInlineLimit: 0
      }
    };
});
