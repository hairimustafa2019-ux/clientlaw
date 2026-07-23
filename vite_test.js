import { build } from 'vite';
(async () => {
  try {
    await build({
      root: process.cwd(),
      build: { outDir: 'dist_test', rollupOptions: { input: 'src/main.tsx' } }
    });
  } catch (e) {
    console.error(e);
  }
})();
