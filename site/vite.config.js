import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// The site imports ../sample_station_information_2023_07_29.json at build time, so every number is computed, never typed.
export default defineConfig({
  base: '/toronto_bikeshare_station_info/',
  plugins: [react()],
  server: { fs: { allow: ['..'] } },
});
