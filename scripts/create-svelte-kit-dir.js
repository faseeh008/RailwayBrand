#!/usr/bin/env node
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

// Create .svelte-kit directory and minimal tsconfig.json
const svelteKitDir = join(process.cwd(), '.svelte-kit');
const tsconfigPath = join(svelteKitDir, 'tsconfig.json');

try {
  await mkdir(svelteKitDir, { recursive: true });
  
  // Create standalone tsconfig that doesn't extend anything
  const minimalTsConfig = {
    compilerOptions: {
      allowJs: true,
      checkJs: true,
      esModuleInterop: true,
      skipLibCheck: true,
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      module: 'ESNext',
      target: 'ES2020',
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      strict: true
    }
  };
  
  await writeFile(tsconfigPath, JSON.stringify(minimalTsConfig, null, 2));
  console.log('✅ Created .svelte-kit directory and tsconfig.json');
} catch (error) {
  console.error('⚠️ Could not create .svelte-kit directory:', error.message);
  // Don't fail, just continue
}

