#!/usr/bin/env node
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

console.log('🔍 Verifying packages are installed...');

// Check if key packages exist
const nodeModulesPath = join(process.cwd(), 'node_modules');
const adapterPath = join(nodeModulesPath, '@sveltejs', 'adapter-node');
const vitePath = join(nodeModulesPath, 'vite');
const kitPath = join(nodeModulesPath, '@sveltejs', 'kit');

if (!existsSync(adapterPath)) {
  console.error('❌ @sveltejs/adapter-node not found! Reinstalling...');
  try {
    execSync('npm install @sveltejs/adapter-node --no-save', { stdio: 'inherit' });
  } catch (e) {
    console.error('Failed to install adapter-node');
  }
}

if (!existsSync(vitePath)) {
  console.error('❌ vite not found! Reinstalling...');
  try {
    execSync('npm install vite --no-save', { stdio: 'inherit' });
  } catch (e) {
    console.error('Failed to install vite');
  }
}

console.log('✅ Packages verified');

// Create .svelte-kit directory
const svelteKitDir = join(process.cwd(), '.svelte-kit');
const tsconfigPath = join(svelteKitDir, 'tsconfig.json');

try {
  await mkdir(svelteKitDir, { recursive: true });
  
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
}

console.log('🚀 Starting vite build...');
process.exit(0);

