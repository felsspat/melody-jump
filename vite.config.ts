import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  server: {
    // Projekt liegt auf dem Windows-Laufwerk, Node läuft in WSL: dort
    // kommen Dateiänderungen nur per Polling zuverlässig an.
    watch: { usePolling: true, interval: 300 },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
