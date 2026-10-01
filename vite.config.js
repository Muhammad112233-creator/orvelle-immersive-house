import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

// ---------------------------------------------------------------------------
//  ORVELLE — "A Room We Never Left"
//  Build configuration
// ---------------------------------------------------------------------------

export default defineConfig({
  base: "./",

  plugins: [vue()],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    hmr: { clientPort: 443, protocol: "wss" },
  },

  preview: {
    host: "0.0.0.0",
    port: 4173,
    allowedHosts: true,
  },

  build: {
    outDir: "dist",
    assetsDir: "assets",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // mirrors the reference build: one app chunk, one vendor chunk,
        // route/interaction chunks loaded on demand
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("three")) return "vendor-three";
            return "vendor";
          }
        },
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash][extname]",
      },
    },
  },
});
