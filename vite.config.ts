import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // nebo 'vite-plugin-tailwindcss' podle verze
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: './', 
    plugins: [react(), tailwindcss()],
    build: {
      outDir: 'docs', 
      emptyOutDir: true,
    },
    define: {
      // Tímto zpřístupníte proměnnou v kódu jako process.env.GEMINI_API_KEY
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        // Oprava cesty, aby @ skutečně mířilo do src nebo kořene
        '@': path.resolve(__dirname, './src'), 
      },
    },
    server: {
      // Kontrola, zda process.env vůbec v Node prostředí existuje (pro HMR)
      hmr: typeof process !== 'undefined' && process.env.DISABLE_HMR !== 'true',
    },
  };
});
