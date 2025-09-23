import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/", // Base public path
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Configuração do proxy para a API de geração de documentos
      '/generate-document': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Erro no proxy:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Requisição para a API:', req.method, req.url);
          });
        }
      },
      // Configuração do proxy para a rota de templates
      '/api/templates': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist", // Diretório de saída do build
    sourcemap: mode === "development", // Gera sourcemaps apenas em desenvolvimento
    minify: "terser", // Minifica o código para produção
    terserOptions: {
      compress: {
        drop_console: mode !== "development", // Remove console.log em produção
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Separa as dependências em chunks menores para melhor performance
          react: ["react", "react-dom", "react-router-dom"],
          vendor: ["@supabase/supabase-js", "zod", "date-fns"],
        },
      },
    },
  },
}));
