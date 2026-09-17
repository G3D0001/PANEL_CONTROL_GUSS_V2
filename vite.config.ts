import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Separar las librerías pesadas en chunks propios. Así el navegador las
      // cachea entre visitas y no las vuelve a descargar en cada deploy de la app.
      rollupOptions: {
        output: {
          // Agrupamos por ruta en node_modules (más robusto que listar nombres:
          // paquetes como "firebase" no se pueden resolver como specifier pelado).
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return;
            if (id.includes('/three/') || id.includes('/three-')) return 'vendor-three';
            if (id.includes('/leaflet') || id.includes('/react-leaflet')) return 'vendor-maps';
            if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/victory-')) return 'vendor-charts';
            if (id.includes('/jspdf') || id.includes('/html2canvas')) return 'vendor-pdf';
            if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'vendor-firebase';
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router') ||
              id.includes('/scheduler/')
            ) return 'vendor-react';
          },
        },
      },
      // Subir el umbral de aviso: los chunks vendor grandes ya están aislados.
      chunkSizeWarningLimit: 1200,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
