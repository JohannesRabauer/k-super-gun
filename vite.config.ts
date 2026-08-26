import { defineConfig } from "vite";

// Base path matches the GitHub Pages project URL: https://<owner>.github.io/k-super-gun/
export default defineConfig({
  base: "/k-super-gun/",
  build: {
    outDir: "dist",
  },
});
