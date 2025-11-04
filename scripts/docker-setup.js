#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config();

const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
	try {
		log(`🔄 ${description}...`, 'blue');
		execSync(command, { stdio: 'inherit' });
		log(`✅ ${description} completed!`, 'green');
		return true;
	} catch (error) {
		log(`❌ ${description} failed: ${error.message}`, 'red');
		return false;
	}
}

function checkDockerInstalled() {
	try {
		execSync('docker --version', { stdio: 'pipe' });
		execSync('docker-compose --version', { stdio: 'pipe' });
		return true;
	} catch (error) {
		return false;
	}
}

async function waitForDatabase() {
	log('⏳ Waiting for database to be ready...', 'yellow');

	const maxAttempts = 30;
	let attempts = 0;

	while (attempts < maxAttempts) {
		try {
			execSync('docker-compose exec db pg_isready -U postgres -d local', {
				stdio: 'pipe'
			});
			log('✅ Database is ready!', 'green');
			return true;
		} catch (error) {
			attempts++;
			log(`⏳ Attempt ${attempts}/${maxAttempts} - Database not ready yet...`, 'yellow');
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
	}

	log('❌ Database failed to start within timeout period', 'red');
	return false;
}

async function setupWithDocker() {
	log('🐳 Setting up EternaBrand with Docker...', 'cyan');
	log('', 'reset');

	// Check if Docker is installed
	if (!checkDockerInstalled()) {
		log('❌ Docker and Docker Compose are required but not installed.', 'red');
		log(
			'Please install Docker Desktop from: https://www.docker.com/products/docker-desktop',
			'yellow'
		);
		process.exit(1);
	}

	// Check if .env file exists
	if (!existsSync('.env')) {
		log('⚠️  .env file not found. Copying from .env.example...', 'yellow');
		runCommand('cp .env.example .env', 'Copy environment file');
		log('📝 Please edit .env file with your configuration before continuing.', 'yellow');
	}

	// Start Docker services
	if (!runCommand('docker-compose up -d db', 'Starting PostgreSQL (pgvector) container')) {
		process.exit(1);
	}

	// Wait for database to be ready
	if (!(await waitForDatabase())) {
		process.exit(1);
	}

	// Generate database schema
	if (!runCommand('npm run db:generate', 'Generating database schema')) {
		process.exit(1);
	}

	// Push schema to database
	if (!runCommand('npm run db:push', 'Pushing database schema')) {
		process.exit(1);
	}

	log('', 'reset');
	log('🎉 Docker setup completed successfully!', 'green');
	log('', 'reset');
	log('📋 Available commands:', 'cyan');
	log('  npm run dev:docker    - Start development server with Docker DB', 'reset');
	log('  npm run docker:up     - Start all Docker services', 'reset');
	log('  npm run docker:down   - Stop all Docker services', 'reset');
	log('  npm run docker:logs   - View Docker logs', 'reset');
	log('  npm run docker:reset  - Reset Docker volumes and restart', 'reset');
	log('  npm run db:studio     - Open Drizzle Studio', 'reset');
	log('', 'reset');
	log('🌐 Access your application at: http://localhost:5173', 'green');
	log('🗄️  Database available at: localhost:5432', 'green');
	log('📊 Drizzle Studio: npm run db:studio', 'green');
}

setupWithDocker().catch((error) => {
	log(`❌ Setup failed: ${error.message}`, 'red');
	process.exit(1);
});
