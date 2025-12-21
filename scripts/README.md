# Automation Scripts

This directory contains TypeScript scripts for automating project tasks.

## Scripts

### create-example.ts

**Purpose**: Generate standalone example projects

**Usage**:
```bash
ts-node scripts/create-example.ts <output-dir>
npx ts-node scripts/create-example.ts ./output/my-survey
```

**What it does**:
- Creates a complete standalone Hardhat project
- Copies all contracts, tests, and configuration
- Generates setup instructions
- Preserves all documentation

**Output**:
- Standalone project with all necessary files
- SETUP.md with quick start instructions

### generate-docs.ts

**Purpose**: Generate GitBook-compatible documentation

**Usage**:
```bash
ts-node scripts/generate-docs.ts
ts-node scripts/generate-docs.ts --all
```

**What it does**:
- Extracts documentation from Solidity contracts
- Generates test documentation from TypeScript
- Creates GitBook-compatible markdown files
- Generates SUMMARY.md for navigation

**Output**:
- `examples/00-README.md` - Documentation overview
- `examples/01-contract.md` - Contract documentation
- `examples/02-api.md` - API reference
- `examples/03-tests.md` - Test coverage
- `examples/04-fhevm-concepts.md` - FHEVM concepts
- `examples/SUMMARY.md` - GitBook navigation

## Running Scripts

### Via npm (Recommended)

```bash
# Create example
npm run create-example -- ./output/my-survey

# Generate documentation
npm run generate-docs
npm run generate-all-docs
```

### Directly

```bash
# Install ts-node globally (optional)
npm install -g ts-node

# Create example
ts-node scripts/create-example.ts ./output/my-survey

# Generate docs
ts-node scripts/generate-docs.ts
```

## Script Features

### Color Output
All scripts use colored terminal output:
- 🟢 Green - Success messages
- 🔵 Blue - Information
- 🟡 Yellow - Warnings
- 🔴 Red - Errors
- 🔷 Cyan - Headers

### Error Handling
- Validates inputs
- Provides helpful error messages
- Exits gracefully on errors

### Logging
- Clear progress messages
- Success confirmations
- Helpful next steps

## Example Workflow

```bash
# 1. Create a standalone example
ts-node scripts/create-example.ts ../examples/my-survey

# 2. Navigate to the example
cd ../examples/my-survey

# 3. Install dependencies
npm install

# 4. Run the example
npm run compile
npm run test

# 5. Back in original project, generate docs
cd ../..
ts-node scripts/generate-docs.ts

# 6. View generated documentation
ls examples/
```

## Dependencies

Scripts require:
- Node.js 20+
- npm or yarn
- TypeScript (installed via dependencies)
- ts-node (for running TypeScript directly)

## Troubleshooting

### ts-node not found
```bash
npm install --save-dev ts-node
```

### Permission denied
On Unix-like systems:
```bash
chmod +x scripts/*.ts
```

### Invalid TypeScript
Ensure `tsconfig.json` is present and valid.

---

For more information, see the main [README.md](../README.md)
