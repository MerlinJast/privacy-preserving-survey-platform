#!/usr/bin/env ts-node

/**
 * create-example - CLI tool to generate standalone Employee Privacy Survey example
 *
 * Usage: ts-node scripts/create-example.ts [output-dir]
 *
 * Example: ts-node scripts/create-example.ts ./output/employee-privacy-survey
 *
 * This script:
 * - Creates a complete standalone Hardhat project
 * - Copies contracts, tests, and configuration
 * - Generates README with setup instructions
 * - Initializes package.json with dependencies
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Color codes for terminal output
enum Color {
  Reset = '\x1b[0m',
  Green = '\x1b[32m',
  Blue = '\x1b[34m',
  Yellow = '\x1b[33m',
  Red = '\x1b[31m',
  Cyan = '\x1b[36m',
}

function log(message: string, color: Color = Color.Reset): void {
  console.log(`${color}${message}${Color.Reset}`);
}

function error(message: string): never {
  log(`❌ Error: ${message}`, Color.Red);
  process.exit(1);
}

function success(message: string): void {
  log(`✅ ${message}`, Color.Green);
}

function info(message: string): void {
  log(`ℹ️  ${message}`, Color.Blue);
}

function warning(message: string): void {
  log(`⚠️  ${message}`, Color.Yellow);
}

/**
 * Copy directory recursively, excluding certain files
 */
function copyDirectoryRecursive(source: string, destination: string, excludeDirs: string[] = []): void {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const items = fs.readdirSync(source);

  items.forEach(item => {
    const sourcePath = path.join(source, item);
    const destPath = path.join(destination, item);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      // Skip excluded directories
      const defaultExclude = ['node_modules', 'artifacts', 'cache', 'coverage', 'types', 'dist', 'fhevmTemp'];
      if ([...defaultExclude, ...excludeDirs].includes(item)) {
        return;
      }
      copyDirectoryRecursive(sourcePath, destPath, excludeDirs);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
}

/**
 * Generate standalone example project
 */
function generateExample(outputDir: string): void {
  const sourceDir = process.cwd();

  info('Starting example generation...');
  info(`Source: ${sourceDir}`);
  info(`Output: ${outputDir}`);

  // Create output directory
  if (fs.existsSync(outputDir)) {
    error(`Output directory already exists: ${outputDir}`);
  }
  fs.mkdirSync(outputDir, { recursive: true });

  // Copy essential directories and files
  const itemsToCopy = [
    'contracts',
    'test',
    'deploy',
    'tasks',
    'hardhat.config.ts',
    'package.json',
    'tsconfig.json',
    '.eslintrc.json',
    '.eslintignore',
    '.prettierrc.json',
    '.solhint.json',
    '.solcover.js',
    '.gitignore',
    'README.md',
    'DEVELOPER_GUIDE.md',
    'LICENSE',
  ];

  info('Copying project files...');
  itemsToCopy.forEach(item => {
    const sourcePath = path.join(sourceDir, item);
    const destPath = path.join(outputDir, item);

    if (fs.existsSync(sourcePath)) {
      const stat = fs.statSync(sourcePath);
      if (stat.isDirectory()) {
        copyDirectoryRecursive(sourcePath, destPath);
        success(`  Copied directory: ${item}`);
      } else {
        fs.copyFileSync(sourcePath, destPath);
        success(`  Copied file: ${item}`);
      }
    } else {
      warning(`  Skipped (not found): ${item}`);
    }
  });

  // Create empty directories
  const dirsToCreate = ['artifacts', 'cache', 'coverage', 'types'];
  dirsToCreate.forEach(dir => {
    const dirPath = path.join(outputDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });

  // Generate setup instructions
  const setupInstructions = `
# Setup Instructions

This is a standalone Employee Privacy Survey FHEVM example.

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Configure environment variables
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to localhost
npm run deploy:localhost

# Deploy to Sepolia
npm run deploy:sepolia
\`\`\`

## Project Structure

- \`contracts/\` - Smart contracts
- \`test/\` - Test suite
- \`deploy/\` - Deployment scripts
- \`tasks/\` - Custom Hardhat tasks

## Documentation

See README.md for complete documentation.

---

Generated on: ${new Date().toISOString()}
Source: Employee Privacy Survey FHEVM Example
`;

  fs.writeFileSync(path.join(outputDir, 'SETUP.md'), setupInstructions.trim());
  success('Generated SETUP.md');

  success(`\n✨ Example generated successfully at: ${outputDir}`);
  info('\nNext steps:');
  info(`  cd ${outputDir}`);
  info('  npm install');
  info('  npx hardhat vars set MNEMONIC');
  info('  npm run compile');
  info('  npm run test');
}

/**
 * Main CLI entry point
 */
function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
${Color.Cyan}Employee Privacy Survey - Example Generator${Color.Reset}

${Color.Yellow}Usage:${Color.Reset}
  ts-node scripts/create-example.ts [output-dir]

${Color.Yellow}Arguments:${Color.Reset}
  output-dir    Output directory for the generated example (required)

${Color.Yellow}Examples:${Color.Reset}
  ts-node scripts/create-example.ts ./output/my-survey
  ts-node scripts/create-example.ts ../standalone-examples/employee-survey

${Color.Yellow}Description:${Color.Reset}
  Generates a complete standalone Hardhat project with:
  - EmployeePrivacySurvey contract
  - Comprehensive test suite
  - Deployment scripts
  - Hardhat tasks
  - Complete documentation
    `);
    process.exit(0);
  }

  const outputDir = path.resolve(args[0]);
  generateExample(outputDir);
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { generateExample };
