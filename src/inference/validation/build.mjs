import { build } from 'vite'
await build({ configFile: false, build: { outDir: '/tmp/nobg-harness-dist', emptyOutDir: true,
  rolldownOptions: { input: 'src/inference/validation/harness.html' } } })
