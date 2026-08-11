import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Unique id for this build; also written to dist/version.json so running
// tabs can detect that a newer deployment exists.
const buildId = `${Date.now()}`;

// Emits dist/version.json at build time (no extra dependencies).
const versionFilePlugin = () => ({
  name: "emit-version-file",
  apply: "build" as const,
  generateBundle(_options: unknown, _bundle: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).emitFile({
      type: "asset",
      fileName: "version.json",
      source: JSON.stringify({ buildId, builtAt: new Date().toISOString() }),
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [
    react(),
    versionFilePlugin(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
