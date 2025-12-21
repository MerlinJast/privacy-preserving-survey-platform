# Developer Guide - Employee Privacy Survey FHEVM Example

This guide helps developers understand and extend the Employee Privacy Survey FHEVM example.

## Project Overview

The Employee Privacy Survey demonstrates key Fully Homomorphic Encryption (FHE) concepts:

- **Encryption**: Converting plaintext data to ciphertext
- **Access Control**: Managing permissions for encrypted data
- **Homomorphic Operations**: Computing on encrypted data without decryption
- **Decryption**: Revealing aggregated results

## Understanding the Code

### 1. Smart Contract Architecture

**File**: `contracts/EmployeePrivacySurvey.sol`

#### Key Components

```solidity
contract EmployeePrivacySurvey is SepoliaConfig {
    // Survey storage with encrypted responses
    mapping(uint256 => Survey) public surveys;

    // Data structure for encrypted responses
    struct Survey {
        mapping(uint256 => euint8[]) encryptedResponses; // questionId => encrypted ratings
    }
}
```

#### FHEVM Operations Used

| Operation | Purpose | Example |
|-----------|---------|---------|
| `FHE.asEuint8()` | Encrypt value | `FHE.asEuint8(rating)` |
| `FHE.add()` | Homomorphic addition | `encryptedSum = FHE.add(a, b)` |
| `FHE.allowThis()` | Grant contract access | `FHE.allowThis(encryptedValue)` |
| `FHE.allow()` | Grant user access | `FHE.allow(encryptedValue, msg.sender)` |
| `FHE.toBytes32()` | Convert to handle | `FHE.toBytes32(encryptedValue)` |
| `FHE.requestDecryption()` | Trigger decryption | `FHE.requestDecryption(cts, callback)` |

### 2. Test Structure

**File**: `test/EmployeePrivacySurvey.ts`

Tests are organized by FHEVM concept:

```typescript
describe("EmployeePrivacySurvey - FHEVM Access Control", () => {
  describe("Survey Creation & Metadata", () => {
    // Tests for survey creation
  });

  describe("Encrypted Responses & FHE Access Control", () => {
    // Tests for encrypted input handling
  });

  describe("Survey Lifecycle", () => {
    // Tests for state management
  });

  describe("Encrypted Arithmetic & Aggregation", () => {
    // Tests for homomorphic operations
  });
});
```

### 3. Deployment

**File**: `deploy/deploy.ts`

Uses hardhat-deploy for deterministic deployments:

```typescript
const func: DeployFunction = async (hre) => {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("EmployeePrivacySurvey", { from: deployer });
};
```

## Development Workflow

### Setting Up Development Environment

```bash
# Clone and install
git clone <repo>
npm install

# Set up environment variables
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY

# Verify setup
npm run compile
npm run test
```

### Adding a New FHEVM Concept Example

1. **Create a new test** in `test/EmployeePrivacySurvey.ts`:

```typescript
describe("New FHEVM Concept", () => {
  it("should demonstrate the concept", async () => {
    // Test implementation
  });
});
```

2. **Implement the contract feature** in `contracts/EmployeePrivacySurvey.sol`:

```solidity
function newFeature() external {
    // FHEVM operations
    euint8 encrypted = FHE.asEuint8(value);
    FHE.allowThis(encrypted);
}
```

3. **Run tests** to verify:

```bash
npm run test -- --grep "New FHEVM Concept"
```

### Common Development Tasks

#### Writing Tests with FHEVM

```typescript
// Import FHEVM mock
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

// Check if running on mock environment
beforeEach(function () {
  if (!fhevm.isMock) {
    this.skip();
  }
});

// Encrypt test data
const encrypted = await fhevm
  .createEncryptedInput(contractAddress, signerAddress)
  .add8(5)
  .encrypt();

// Decrypt user data for verification
const decrypted = await fhevm.userDecryptEuint(
  FhevmType.euint8,
  encryptedValue,
  contractAddress,
  signer
);
```

#### Deploying to Sepolia

```bash
# Set environment variables
export INFURA_API_KEY=your_api_key
export ETHERSCAN_API_KEY=your_etherscan_key

# Deploy
npm run deploy:sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia <ADDRESS>
```

#### Running Tests with Coverage

```bash
# Generate coverage report
npm run coverage

# View results in coverage/index.html
```

## FHEVM Concepts Explained

### 1. Encryption

**Concept**: Converting plaintext to ciphertext using FHE

```solidity
// Encrypt a rating (0-255)
euint8 encryptedRating = FHE.asEuint8(5);
```

**Privacy Guarantee**: Contract cannot read the actual value

**Learning**: Understand FHE encryption types (euint8, euint16, euint32, euint64)

### 2. Access Control

**Concept**: Managing who can use encrypted data

```solidity
// Contract can compute with this value
FHE.allowThis(encryptedRating);

// User can decrypt this value
FHE.allow(encryptedRating, msg.sender);
```

**Security**: Only authorized parties access encrypted data

**Learning**: Understand permission models and multi-party scenarios

### 3. Homomorphic Arithmetic

**Concept**: Computing on encrypted data without decryption

```solidity
// Add two encrypted values
euint8 sum = FHE.add(encrypted1, encrypted2);
// Result is still encrypted!
```

**Benefits**: Computation without exposure

**Limitation**: Limited to addition/subtraction; some operations unavailable

### 4. Decryption

**Concept**: Revealing plaintext from ciphertext

```solidity
// Request decryption of aggregated result
FHE.requestDecryption(cts, this.processResult.selector);

// Callback with decrypted value
function processResult(uint256 requestId, uint8 decrypted) external {
    // Use decrypted value
}
```

**Async Pattern**: Decryption happens off-chain via relayer

**Use Case**: Aggregate results without revealing individual data

## Extending the Example

### Adding New Survey Questions

```typescript
// In tests
const questions = [
  "Question 1",
  "Question 2",
  "Question 3"  // Add new question
];

const surveyId = await contract.createSurvey(
  "Title",
  "Description",
  questions,
  7
);
```

### Implementing Different Rating Scales

**Current**: 1-5 scale using euint8

**Options**:
- Larger scale: Use euint16 or euint32
- Different validation: Modify `require(rating >= 1 && rating <= 5)`

```solidity
// Example: 1-10 scale
euint8 encryptedRating = FHE.asEuint8(rating); // Still euint8 for 1-10
require(rating >= 1 && rating <= 10, "Rating must be 1-10");
```

### Adding Weighted Averaging

**Current**: Simple arithmetic mean

**Enhancement**: Implement weighted average
```solidity
// Store weights
mapping(uint256 => euint8) weights;

// Compute weighted sum
euint8 weightedSum = FHE.add(
    FHE.mul(response1, weight1),
    FHE.mul(response2, weight2)
);
```

### Multi-Question Aggregation

**Current**: Per-question averaging

**Enhancement**: Composite scores
```solidity
// Aggregate multiple questions
euint16 compositeScore = FHE.add(
    FHE.add(FHE.add(q1, q2), q3),
    q4
);
```

## Debugging FHEVM Code

### Common Issues

#### Issue: Access Control Errors

```
Error: Not authorized to decrypt
```

**Cause**: Missing `FHE.allow()` call

**Fix**:
```solidity
FHE.allow(encryptedValue, address);
```

#### Issue: Type Mismatches

```
Error: Cannot decrypt euint32 as euint8
```

**Cause**: Type mismatch in decryption

**Fix**: Use correct type in `FhevmType.euint32`

#### Issue: Tests Fail on Sepolia

```
Error: This test suite cannot run on Sepolia Testnet
```

**Cause**: FHEVM mock not available on testnet

**Expected Behavior**: Tests skip gracefully on non-mock networks

### Debugging Strategies

1. **Enable Logging**:
```typescript
console.log("Encrypted value:", encryptedValue);
console.log("Decrypted value:", decrypted);
```

2. **Use Assertions**:
```typescript
expect(survey.totalResponses).to.equal(3);
expect(hasResponded).to.be.true;
```

3. **Test Incrementally**:
- Test encryption alone
- Test access control separately
- Test arithmetic operations
- Test full workflow

## Performance Optimization

### Gas Optimization

Current contract is optimized for:
- Minimal storage operations
- Efficient array indexing
- Batch operations where possible

**Future Improvements**:
```solidity
// Instead of individual storage:
for (uint i = 0; i < responses.length; i++) {
    survey.encryptedResponses[i].push(encryptedRating);
}

// Consider: Batch processing
```

### Scaling Considerations

- **Large Surveys**: Array storage grows with responses
- **Multiple Questions**: Each question needs separate array
- **Gas Limits**: Ensure aggregation doesn't exceed gas limits

## Contributing Changes

### Before Submitting

1. **Run Tests**:
```bash
npm run test
```

2. **Check Linting**:
```bash
npm run lint
```

3. **Format Code**:
```bash
npm run prettier:write
```

4. **Verify Documentation**: Update README if adding features

### Pull Request Checklist

- [ ] Tests pass (`npm run test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code formatted (`npm run prettier:write`)
- [ ] Documentation updated
- [ ] New tests added for new features
- [ ] Comments added for complex logic

## Resources

### FHEVM Documentation
- [FHEVM Official Docs](https://docs.zama.ai/fhevm)
- [Hardhat Plugin Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)

### Solidity Learning
- [Solidity Docs](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

### Hardhat Resources
- [Hardhat Documentation](https://hardhat.org/getting-started)
- [Hardhat Testing](https://hardhat.org/hardhat-chai-matchers/overview)

## Support

- **Questions**: Open an issue on GitHub
- **Suggestions**: Start a discussion
- **Bugs**: Report with minimal reproduction case

---

**Happy developing with FHEVM!**
