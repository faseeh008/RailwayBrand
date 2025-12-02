#!/usr/bin/env node
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

// Create .svelte-kit directory and minimal tsconfig.json
const svelteKitDir = join(process.cwd(), '.svelte-kit');
const tsconfigPath = join(svelteKitDir, 'tsconfig.json');

try {
  await mkdir(svelteKitDir, { recursive: true });
  
  const minimalTsConfig = {
    extends: './tsconfig.json',
    compilerOptions: {
      allowJs: true,
      checkJs: true,
      esModuleInterop: true,
      skipLibCheck: true,
      moduleResolution: 'bundler'
    }
  };
  
  await writeFile(tsconfigPath, JSON.stringify(minimalTsConfig, null, 2));
  console.log('✅ Created .svelte-kit directory and tsconfig.json');
} catch (error) {
  console.error('⚠️ Could not create .svelte-kit directory:', error.message);
  // Don't fail, just continue
}

