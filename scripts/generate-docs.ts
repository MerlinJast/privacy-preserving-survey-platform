#!/usr/bin/env ts-node

/**
 * generate-docs - CLI tool to generate GitBook-compatible documentation
 *
 * Usage: ts-node scripts/generate-docs.ts [--all]
 *
 * Example: ts-node scripts/generate-docs.ts
 *          ts-node scripts/generate-docs.ts --all
 *
 * This script:
 * - Extracts documentation from Solidity contracts
 * - Generates test documentation from test comments
 * - Creates GitBook-compatible markdown files
 * - Generates SUMMARY.md for GitBook navigation
 */

import * as fs from 'fs';
import * as path from 'path';

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

/**
 * Extract JSDoc and NatSpec comments from Solidity code
 */
function extractSolidityDocs(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const docs: string[] = [];

  let inComment = false;
  let currentComment: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Start of multi-line comment
    if (line.includes('/**') || line.includes('/*')) {
      inComment = true;
      currentComment = [];
      continue;
    }

    // End of multi-line comment
    if (line.includes('*/')) {
      inComment = false;
      if (currentComment.length > 0) {
        docs.push(currentComment.join('\n'));
      }
      currentComment = [];
      continue;
    }

    // Inside comment
    if (inComment) {
      const cleaned = line.replace(/^\s*\*\s?/, '').replace(/^\s*\/\s?/, '');
      currentComment.push(cleaned);
    }
  }

  return docs.join('\n\n');
}

/**
 * Extract JSDoc comments from TypeScript test files
 */
function extractTestDocs(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const docs: string[] = [];

  let inComment = false;
  let currentComment: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('/**') || line.includes('/*')) {
      inComment = true;
      currentComment = [];
      continue;
    }

    if (line.includes('*/')) {
      inComment = false;
      if (currentComment.length > 0) {
        docs.push(currentComment.join('\n'));
      }
      currentComment = [];
      continue;
    }

    if (inComment) {
      const cleaned = line.replace(/^\s*\*\s?/, '').replace(/^\s*\/\s?/, '');
      currentComment.push(cleaned);
    }
  }

  return docs.join('\n\n');
}

/**
 * Generate documentation markdown
 */
function generateContractDoc(): string {
  const contractPath = path.join(process.cwd(), 'contracts', 'EmployeePrivacySurvey.sol');
  const testPath = path.join(process.cwd(), 'test', 'EmployeePrivacySurvey.ts');

  const contractDocs = extractSolidityDocs(contractPath);
  const testDocs = extractTestDocs(testPath);

  const doc = `# Employee Privacy Survey Smart Contract

## Overview

This document provides comprehensive documentation for the EmployeePrivacySurvey FHEVM smart contract.

## Contract Documentation

${contractDocs}

## Test Coverage

${testDocs}

## FHEVM Concepts Demonstrated

### 1. Access Control
- FHE.allowThis() - Grant contract access to encrypted values
- FHE.allow() - Grant user access to decrypt encrypted values
- Multi-party permission management

### 2. Encrypted Input
- Converting plaintext to euint8 (encrypted unsigned 8-bit integers)
- Input validation before encryption
- Encrypted data storage and retrieval

### 3. Homomorphic Arithmetic
- FHE.add() - Adding encrypted values without decryption
- Aggregating encrypted responses
- Computing on encrypted data

### 4. Public Decryption
- Requesting decryption of aggregated results
- Callback pattern for decryption results
- Selective revelation of aggregated data

## Key Functions

### createSurvey()
Creates a new survey with specified questions and duration.

### submitResponse()
Submits encrypted survey responses (1-5 ratings).

### publishResults()
Marks survey as ready for result aggregation.

### requestQuestionAverage()
Requests aggregation and decryption of average rating.

## Security Considerations

- All individual responses remain encrypted
- Only aggregated results are decrypted
- Access control prevents unauthorized data access
- Input validation ensures data integrity

## Testing Guide

See test/EmployeePrivacySurvey.ts for comprehensive test examples.

---

Generated on: ${new Date().toISOString()}
`;

  return doc;
}

/**
 * Generate API documentation
 */
function generateAPIDoc(): string {
  return `# API Reference

## EmployeePrivacySurvey Contract

### State Variables

\`\`\`solidity
address public owner;
uint256 public surveyCounter;
mapping(uint256 => Survey) public surveys;
\`\`\`

### Events

#### SurveyCreated
\`\`\`solidity
event SurveyCreated(
    uint256 indexed surveyId,
    address indexed creator,
    string title,
    uint256 endTime
)
\`\`\`

#### ResponseSubmitted
\`\`\`solidity
event ResponseSubmitted(
    uint256 indexed surveyId,
    address indexed respondent,
    uint256 timestamp
)
\`\`\`

#### ResultsPublished
\`\`\`solidity
event ResultsPublished(
    uint256 indexed surveyId,
    uint256 totalResponses
)
\`\`\`

### Functions

#### createSurvey
\`\`\`solidity
function createSurvey(
    string memory _title,
    string memory _description,
    string[] memory _questions,
    uint256 _durationDays
) external returns (uint256)
\`\`\`

Creates a new survey with encrypted responses capability.

#### submitResponse
\`\`\`solidity
function submitResponse(
    uint256 _surveyId,
    uint8[] memory _ratings
) external
\`\`\`

Submits encrypted survey responses (1-5 ratings).

#### publishResults
\`\`\`solidity
function publishResults(uint256 _surveyId) external
\`\`\`

Publishes survey results and enables aggregation.

#### requestQuestionAverage
\`\`\`solidity
function requestQuestionAverage(uint256 _surveyId, uint256 _questionId) external
\`\`\`

Requests decryption of average rating for a question.

#### Query Functions
- \`getSurvey()\` - Get survey information
- \`getSurveyQuestions()\` - Get survey questions
- \`hasResponded()\` - Check if employee responded
- \`getCurrentSurveyInfo()\` - Get survey status

---

Generated on: ${new Date().toISOString()}
`;
}

/**
 * Generate SUMMARY.md for GitBook
 */
function generateSummary(): string {
  return `# Summary

## Introduction

- [Overview](README.md)

## Documentation

- [Contract Documentation](01-contract.md)
- [API Reference](02-api.md)
- [Test Coverage](03-tests.md)
- [FHEVM Concepts](04-fhevm-concepts.md)

## Getting Started

- [Installation](../README.md#quick-start)
- [Deployment](../README.md#deployment)
- [Testing](../README.md#running-tests)

## Advanced

- [Developer Guide](../DEVELOPER_GUIDE.md)
- [Architecture](../README.md#-architecture)
- [Security](../README.md#-privacy--security)

---

Generated on: ${new Date().toISOString()}
`;
}

/**
 * Generate FHEVM concepts documentation
 */
function generateFHEVMConcepts(): string {
  return `# FHEVM Concepts

## Overview

This document explains the FHEVM concepts demonstrated in the Employee Privacy Survey example.

## 1. Access Control

### FHE.allowThis()
Grants the contract access to use an encrypted value in computations.

\`\`\`solidity
FHE.allowThis(encryptedRating);
\`\`\`

### FHE.allow()
Grants a specific address permission to decrypt an encrypted value.

\`\`\`solidity
FHE.allow(encryptedRating, msg.sender);
\`\`\`

## 2. Encrypted Input

### Encryption Pattern
Convert plaintext to encrypted form before storage.

\`\`\`solidity
euint8 encryptedRating = FHE.asEuint8(rating);
survey.encryptedResponses[i].push(encryptedRating);
\`\`\`

## 3. Homomorphic Arithmetic

### FHE.add()
Performs addition on encrypted values without decryption.

\`\`\`solidity
euint8 encryptedSum = responses[0];
for (uint256 i = 1; i < responses.length; i++) {
    encryptedSum = FHE.add(encryptedSum, responses[i]);
}
\`\`\`

## 4. Public Decryption

### Decryption Request
Initiate decryption of aggregated results.

\`\`\`solidity
FHE.requestDecryption(cts, this.processQuestionAverage.selector);
\`\`\`

## Privacy Guarantees

- **Encrypted Storage**: All individual responses are encrypted
- **No Plain-text Access**: Cannot view individual encrypted values
- **Aggregation Only**: Only aggregated results are decrypted
- **Access Control**: Strict permission management

## Use Cases

- Employee satisfaction surveys
- Anonymous voting systems
- Confidential polls
- Privacy-preserving aggregations

---

Generated on: ${new Date().toISOString()}
`;
}

/**
 * Generate documentation files
 */
function generateDocs(): void {
  const examplesDir = path.join(process.cwd(), 'examples');

  // Create examples directory
  if (!fs.existsSync(examplesDir)) {
    fs.mkdirSync(examplesDir, { recursive: true });
    success('Created examples directory');
  }

  info('Generating documentation...');

  // Generate documentation files
  const docs = [
    {
      name: '00-README.md',
      content: `# Employee Privacy Survey - FHEVM Example Documentation

This is the GitBook documentation for the Employee Privacy Survey FHEVM example.

## Contents

1. [Contract Documentation](01-contract.md) - Smart contract source and design
2. [API Reference](02-api.md) - Complete function and event reference
3. [Test Coverage](03-tests.md) - Test suite and examples
4. [FHEVM Concepts](04-fhevm-concepts.md) - FHE operations explained

## Quick Links

- [Main README](../README.md)
- [Developer Guide](../DEVELOPER_GUIDE.md)
- [Source Code](../contracts/EmployeePrivacySurvey.sol)

---

Generated on: ${new Date().toISOString()}`,
    },
    { name: '01-contract.md', content: generateContractDoc() },
    { name: '02-api.md', content: generateAPIDoc() },
    { name: '03-tests.md', content: `# Test Coverage\n\nSee ../test/EmployeePrivacySurvey.ts for comprehensive test cases.\n\n---\n\nGenerated on: ${new Date().toISOString()}` },
    { name: '04-fhevm-concepts.md', content: generateFHEVMConcepts() },
  ];

  docs.forEach(doc => {
    const filePath = path.join(examplesDir, doc.name);
    fs.writeFileSync(filePath, doc.content);
    success(`  Generated: ${doc.name}`);
  });

  // Generate SUMMARY.md
  const summaryPath = path.join(examplesDir, 'SUMMARY.md');
  fs.writeFileSync(summaryPath, generateSummary());
  success('  Generated: SUMMARY.md');
}

/**
 * Main CLI entry point
 */
function main(): void {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${Color.Cyan}Documentation Generator${Color.Reset}

${Color.Yellow}Usage:${Color.Reset}
  ts-node scripts/generate-docs.ts [options]

${Color.Yellow}Options:${Color.Reset}
  --all       Generate all documentation
  --help      Show this help message

${Color.Yellow}Examples:${Color.Reset}
  ts-node scripts/generate-docs.ts
  ts-node scripts/generate-docs.ts --all

${Color.Yellow}Description:${Color.Reset}
  Generates GitBook-compatible markdown documentation from:
  - Solidity contract comments
  - TypeScript test comments
  - FHEVM concept explanations
    `);
    process.exit(0);
  }

  generateDocs();
  success('\n✨ Documentation generated successfully');
  info('Documentation location: examples/');
  info('\nGenerated files:');
  info('  - 00-README.md');
  info('  - 01-contract.md');
  info('  - 02-api.md');
  info('  - 03-tests.md');
  info('  - 04-fhevm-concepts.md');
  info('  - SUMMARY.md');
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { generateDocs };
