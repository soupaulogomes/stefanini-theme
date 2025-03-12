import { defineConfig } from "vite";
import adastra from "adastra-plugin";

export default defineConfig({
  publicDir: "public",
  polyfill: false,
  polyfillModulePreload: false,
  plugins: [adastra()],
  build: {
    cssMinify: true,
    jsMinify: true,
    emptyOutDir: false,
    copyPublicDir: false
  },
});
