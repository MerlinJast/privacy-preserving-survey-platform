# Employee Privacy Survey Smart Contract

## Overview

This document provides comprehensive documentation for the EmployeePrivacySurvey FHEVM smart contract.

## Contract Purpose

The EmployeePrivacySurvey contract enables privacy-preserving employee feedback collection through:
- Encrypted survey responses that remain encrypted on-chain
- Homomorphic operations for computing aggregated statistics
- Secure decryption of results only after survey completion
- Fine-grained access control over encrypted data

## FHEVM Concepts Demonstrated

### 1. Access Control
- **FHE.allowThis()** - Grants the contract access to use encrypted values in computations
- **FHE.allow()** - Grants specific users permission to decrypt encrypted values
- **Multi-party Permission Management** - Different entities have different access rights

### 2. Encrypted Input
- Converting plaintext ratings (1-5 scale) to `euint8` encrypted values
- Input validation before encryption to ensure data integrity
- Efficient encrypted data storage and retrieval

### 3. Homomorphic Arithmetic
- **FHE.add()** - Adding encrypted values without ever decrypting them
- Aggregating encrypted responses from multiple survey participants
- Computing on encrypted data while maintaining privacy

### 4. Public Decryption
- Requesting decryption of aggregated results (not individual responses)
- Callback pattern for handling decrypted values
- Selective revelation of aggregated data only

## Key Functions

### createSurvey()
```solidity
function createSurvey(
    string memory _title,
    string memory _description,
    string[] memory _questions,
    uint256 _durationDays
) external returns (uint256)
```
Creates a new survey with specified questions and duration. Returns the survey ID.

### submitResponse()
```solidity
function submitResponse(
    uint256 _surveyId,
    uint8[] memory _ratings
) external surveyActive(_surveyId)
```
Submits encrypted survey responses (1-5 ratings for each question).

### publishResults()
```solidity
function publishResults(uint256 _surveyId) external onlySurveyCreator(_surveyId)
```
Marks survey as closed and ready for result aggregation.

### requestQuestionAverage()
```solidity
function requestQuestionAverage(uint256 _surveyId, uint256 _questionId)
    external onlySurveyCreator(_surveyId)
```
Requests aggregation and decryption of average rating for a specific question.

## Security Considerations

- **Individual Response Privacy**: All individual responses are encrypted and cannot be viewed
- **Aggregated Results Only**: Only aggregated sums are decrypted, never individual values
- **Access Control Enforcement**: Strict permission management prevents unauthorized access
- **Input Validation**: Rating values validated (1-5) before encryption
- **Survey Lifecycle**: Proper state management prevents invalid operations

## Data Structures

### Survey Structure
```solidity
struct Survey {
    address creator;                          // Survey creator address
    string title;                             // Survey title
    string description;                       // Survey description
    string[] questions;                       // Array of questions
    uint256 startTime;                        // Survey start timestamp
    uint256 endTime;                          // Survey end timestamp
    bool active;                              // Survey active status
    bool resultsPublished;                    // Results publication status
    uint256 totalResponses;                   // Count of responses
    mapping(address => bool) hasResponded;    // Response tracking
    mapping(uint256 => euint8[]) encryptedResponses;  // Encrypted ratings
    address[] respondents;                    // List of respondents
}
```

## Privacy Guarantees

1. **Encrypted Storage**: All individual survey responses stored as FHE ciphertexts
2. **No Plain-text Queries**: View functions cannot return decrypted individual responses
3. **Aggregation Only**: Only aggregated sums are ever decrypted
4. **User Privacy**: Individual votes remain encrypted and completely private
5. **Access Control**: FHE.allow() limits who can decrypt what data

---

For test examples and usage patterns, see [01-contract.md](01-contract.md).
