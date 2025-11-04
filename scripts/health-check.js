#!/usr/bin/env node

import { execSync } from 'child_process';

const colors = {
	reset: '\x1b[0m',
	green: '\x1b[32m',
	red: '\x1b[31m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m'
};

function log(message, color = 'reset') {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkService(serviceName, command) {
	try {
		execSync(command, { stdio: 'pipe' });
		log(`✅ ${serviceName} is running`, 'green');
		return true;
	} catch (error) {
		log(`❌ ${serviceName} is not running`, 'red');
		return false;
	}
}

function healthCheck() {
	log('🔍 Checking Docker services health...', 'blue');
	log('', 'reset');

	const services = [
		{
			name: 'PostgreSQL (pgvector)',
			command: 'docker-compose exec db pg_isready -U postgres -d local'
		}
	];

	let allHealthy = true;

	for (const service of services) {
		if (!checkService(service.name, service.command)) {
			allHealthy = false;
		}
	}

	log('', 'reset');

	if (allHealthy) {
		log('🎉 All services are healthy!', 'green');
	} else {
		log('⚠️  Some services are not running. Try:', 'yellow');
		log('   npm run docker:up', 'blue');
		log('   npm run docker:reset', 'blue');
	}

	return allHealthy;
}

healthCheck();
