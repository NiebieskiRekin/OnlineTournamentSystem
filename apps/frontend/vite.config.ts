import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        // changeOrigin: true,
        // secure: false,
      },
    },
  },
  ssr: {
    noExternal: ['@mui/x-data-grid']
  },
  optimizeDeps: {
    include: [
      '@mui/x-data-grid',
      '@mui/x-date-pickers',
      '@mui/material'
    ],
  },
  resolve: {
    alias: {
      "@/frontend": "/app",
    },
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
});
