# Employee Privacy Survey - FHEVM Hardhat Example

A comprehensive Hardhat-based example demonstrating privacy-preserving smart contracts using Fully Homomorphic Encryption (FHE) on Ethereum. This project showcases encrypted voting, access control, and secure data aggregation patterns using the Zama FHEVM protocol.

[Demo](https://youtu.be/kDV9aWp2A2E)

[Live Demo](https://privacy-preserving-survey-platform.vercel.app/)

## Overview

This example implements an **Employee Privacy Survey System** that demonstrates critical FHEVM concepts:

- **Encrypted Input Handling**: Employee survey responses (1-5 ratings) are encrypted before storage
- **Access Control**: Fine-grained permissions using FHE.allow() and FHE.allowThis()
- **Homomorphic Arithmetic**: Computing sums and averages on encrypted data without decryption
- **Public Decryption**: Securely revealing aggregated results while preserving individual privacy
- **Privacy Guarantee**: Individual survey responses remain encrypted and unviewable to all parties

## Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm or yarn/pnpm**: Package manager

### Installation

```bash
# Install dependencies
npm install
```

### Setting Up Environment Variables

```bash
# Configure Hardhat variables (MNEMONIC, INFURA_API_KEY, ETHERSCAN_API_KEY)
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY
```

### Compile and Test

```bash
# Compile all smart contracts
npm run compile

# Run the complete test suite
npm run test

# Run tests with gas reporting
REPORT_GAS=true npm run test

# Generate coverage report
npm run coverage
```

### Deployment

```bash
# Deploy to local Hardhat network
npx hardhat deploy --network hardhat

# Deploy to Sepolia testnet
npx hardhat deploy --network sepolia

# Verify contracts on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## 📁 Project Structure

```
employee-privacy-fhe/
├── contracts/
│   └── EmployeePrivacySurvey.sol    # Main FHEVM survey contract
├── test/
│   └── EmployeePrivacySurvey.ts     # Comprehensive test suite (90+ test cases)
├── deploy/
│   └── deploy.ts                     # Deployment scripts
├── tasks/
│   ├── accounts.ts                   # List available accounts
│   └── EmployeePrivacySurvey.ts      # Custom Hardhat tasks
├── hardhat.config.ts                 # Hardhat configuration
├── package.json                      # Project dependencies
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # This file
```

## 🔐 FHEVM Concepts Demonstrated

### 1. Encrypted Input

```solidity
// Employee ratings are encrypted as euint8 values
euint8 encryptedRating = FHE.asEuint8(rating);
survey.encryptedResponses[i].push(encryptedRating);
```

**Privacy Guarantee**: The survey contract cannot view the actual rating values.

### 2. Access Control Pattern

```solidity
// Contract can use the encrypted value
FHE.allowThis(encryptedRating);

// Employee can decrypt their own response
FHE.allow(encryptedRating, msg.sender);
```

**Access Control**: Only authorized parties can interact with encrypted data.

### 3. Homomorphic Addition

```solidity
// Sum encrypted responses without decryption
euint8 encryptedSum = responses[0];
for (uint256 i = 1; i < responses.length; i++) {
    encryptedSum = FHE.add(encryptedSum, responses[i]);
}
```

**Computation on Encrypted Data**: Aggregate results without revealing individual values.

### 4. Public Decryption

```solidity
// Request decryption of the encrypted sum
FHE.requestDecryption(cts, this.processQuestionAverage.selector);
```

**Secure Aggregation**: Reveal aggregated results while preserving individual privacy.

## 📋 API Reference

### Survey Creation

```solidity
function createSurvey(
    string memory _title,
    string memory _description,
    string[] memory _questions,
    uint256 _durationDays
) external returns (uint256)
```

Creates a new encrypted survey with specified questions and duration.

### Encrypted Response Submission

```solidity
function submitResponse(
    uint256 _surveyId,
    uint8[] memory _ratings
) external
```

Submits encrypted employee ratings (1-5 scale) for all survey questions.

### Result Aggregation

```solidity
function requestQuestionAverage(
    uint256 _surveyId,
    uint256 _questionId
) external
```

Requests aggregation and decryption of average rating for a specific question.

### Queries

- `getSurvey()`: Get survey metadata
- `getSurveyQuestions()`: Get survey questions
- `hasResponded()`: Check if employee has responded
- `getCurrentSurveyInfo()`: Get real-time survey status

## 🧪 Test Coverage

The test suite covers:

### Access Control (Chapter: access-control)
- Permission management with FHE.allow()
- Authorization checks for survey creators
- Owner-only operations

### Encrypted Input (Chapter: encrypted-input)
- Handling encrypted employee ratings
- Rating validation (1-5 range)
- Response encryption lifecycle

### Homomorphic Arithmetic (Chapter: homomorphic-arithmetic)
- Encrypted addition (FHE.add)
- Sum calculation on encrypted data
- Average computation without decryption

### Data Aggregation (Chapter: data-aggregation)
- Multi-response aggregation
- Encrypted sum computation
- Result publication workflow

### Decryption & Results (Chapter: decryption)
- Public decryption requests
- Result callback processing
- Aggregated output revelation

### Survey Lifecycle (Chapter: survey-lifecycle)
- Survey creation
- Active/closed states
- Result publication

### Error Handling & Anti-patterns (Chapter: anti-patterns)
- Duplicate response prevention
- Invalid rating detection
- Expired survey blocking
- Answer count validation

## 🎯 Running Tests

```bash
# Run all tests
npm run test

# Run tests with grep filter
npx hardhat test --grep "Encrypted Responses"

# Run specific test file
npx hardhat test test/EmployeePrivacySurvey.ts

# Run tests on Sepolia testnet
npm run test:sepolia
```

## 📊 Test Results Summary

The test suite includes **90+ comprehensive test cases**:

- **Survey Management**: 10+ tests for creation, closure, and state management
- **Encrypted Input**: 15+ tests for response submission and validation
- **Access Control**: 8+ tests for permission and authorization checks
- **Arithmetic Operations**: 10+ tests for homomorphic addition and aggregation
- **Decryption Workflow**: 8+ tests for result processing
- **Error Scenarios**: 25+ tests for error handling and anti-patterns
- **Edge Cases**: 10+ tests for boundary conditions

## 🔄 Hardhat Custom Tasks

```bash
# List all available accounts
npx hardhat accounts --network hardhat

# Get survey information
npx hardhat get-survey --survey-id 1 --network hardhat

# Get survey questions
npx hardhat get-questions --survey-id 1 --network hardhat

# Create a test survey
npx hardhat create-test-survey --network hardhat

# Submit encrypted response
npx hardhat submit-response --survey-id 1 --ratings 5,4,3,4,5 --network hardhat

# Get total surveys
npx hardhat get-total-surveys --network hardhat
```

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run compile` | Compile Solidity contracts |
| `npm run test` | Run test suite on local FHEVM mock |
| `npm run test:sepolia` | Run tests on Sepolia testnet |
| `npm run coverage` | Generate test coverage report |
| `npm run lint` | Lint Solidity and TypeScript code |
| `npm run lint:sol` | Lint Solidity contracts |
| `npm run lint:ts` | Lint TypeScript code |
| `npm run prettier:write` | Format code with Prettier |
| `npm run build:ts` | Compile TypeScript |
| `npm run typechain` | Generate TypeChain types |
| `npm run clean` | Clean build artifacts |
| `npm run deploy:localhost` | Deploy to local Hardhat node |
| `npm run deploy:sepolia` | Deploy to Sepolia testnet |
| `npm run verify:sepolia` | Verify contract on Etherscan |

## 🏗️ Architecture

### Smart Contract Design

The `EmployeePrivacySurvey` contract implements:

1. **Encrypted Data Storage**
   - Individual responses stored as `euint8[]` arrays
   - One array per question for multi-question surveys
   - Efficient aggregation using array indexing

2. **State Management**
   - Survey lifecycle (created → active → closed → published)
   - Respondent tracking to prevent duplicate votes
   - Result publication workflow

3. **Access Control**
   - Creator-only operations (close survey, publish results, request decryption)
   - Respondent permissions (submit response)
   - Owner-only administrative functions

4. **Event Logging**
   - `SurveyCreated`: New survey initialization
   - `ResponseSubmitted`: Encrypted vote submission
   - `ResultsPublished`: Survey completion
   - `ResultDecryptionRequested`: Aggregation request

## 🔐 Privacy & Security

### Privacy Guarantees

1. **Encrypted Storage**: All survey responses are encrypted using FHEVM
2. **No Plain-text Queries**: View functions cannot return decrypted individual responses
3. **Aggregated Results Only**: Only aggregated (summed) results are decrypted
4. **User Privacy**: Individual votes remain encrypted and anonymous
5. **Access Control**: FHE.allow() limits who can decrypt what data

### Security Considerations

- Input validation: Rating values restricted to 1-5 range
- Access control: Only survey creator can publish and request results
- Duplicates: One response per employee enforced
- Expiration: Survey deadline prevents late votes
- Type safety: Solidity compiler and TypeScript for static analysis

## 📚 Learning Resources

### FHEVM Documentation
- [FHEVM Protocol Guide](https://docs.zama.ai/fhevm)
- [Solidity Integration](https://docs.zama.ai/protocol/solidity-guides)
- [Testing with FHEVM](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)

### Example Concepts

**Access Control** - Understanding FHE permissions
- How FHE.allowThis() grants contract permissions
- How FHE.allow() grants user permissions
- Multi-party permission scenarios

**Encrypted Arithmetic** - Computing on encrypted data
- Homomorphic addition without decryption
- Aggregation patterns
- Result computation

**Decryption Callbacks** - Retrieving results
- Requesting decryption via relayer
- Processing decrypted values
- Result storage patterns

## 🐛 Common Issues & Solutions

### Test Failures on Non-Mock Networks

The test suite uses FHEVM mock features not available on Sepolia testnet.

```bash
# This fails on Sepolia (expected)
npm run test:sepolia

# Use local mock for testing
npm run test
```

### Gas Estimation Issues

FHEVM operations have different gas costs than standard EVM:

```bash
# Generate accurate gas reports
REPORT_GAS=true npm run test
```

### Decryption Callback Integration

The `processQuestionAverage` callback demonstrates the pattern:
- In production, map `requestId` to survey/question
- Store results in `questionResults` mapping
- Emit events for off-chain listeners

## 🤝 Contributing

Improvements and extensions:

1. **Additional Survey Types**
   - Multiple choice questions
   - Open-ended responses (encrypted text)
   - Weighted scoring

2. **Advanced Features**
   - Result visualizations
   - Anonymous respondent lists
   - Time-based surveys

3. **Optimizations**
   - Batch response processing
   - Efficient encryption/decryption
   - Gas optimization

## 📄 License

This project is licensed under the **BSD-3-Clause-Clear License**.

See the [LICENSE](./LICENSE) file for details.

## 🆘 Support & Community

- **Documentation**: [FHEVM Documentation](https://docs.zama.ai)
- **GitHub Issues**: [Report bugs or request features](https://github.com/zama-ai/fhevm/issues)
- **Discord**: [Zama Community Server](https://discord.gg/zama)
- **Forum**: [Zama Community Forum](https://www.zama.ai/community)
- **Twitter**: [@zama_ai](https://twitter.com/zama_ai)

## 🙏 Acknowledgments

Built with ❤️ using the Zama FHEVM protocol for privacy-preserving smart contracts.

---

**Key Takeaway**: This example demonstrates how FHEVM enables encrypted voting and secure aggregation, making it possible to compute meaningful statistics from sensitive data while guaranteeing individual privacy.
