# FHEVM Concepts

## Overview

This document explains the Fully Homomorphic Encryption (FHE) concepts demonstrated in the Employee Privacy Survey example.

## 1. Access Control

### FHE.allowThis()

Grants the smart contract permission to perform operations on an encrypted value.

```solidity
FHE.allowThis(encryptedRating);
```

**Purpose:** Allows the contract to:
- Use the encrypted value in computations
- Perform homomorphic operations
- Access encrypted data in memory

**Example:** After encrypting a rating, the contract needs permission to add it to an encrypted sum.

### FHE.allow()

Grants a specific address (user) permission to decrypt an encrypted value.

```solidity
FHE.allow(encryptedRating, msg.sender);
```

**Purpose:** Allows the specified address to:
- Decrypt the encrypted value
- View the plaintext result
- Verify their own data

**Example:** An employee can decrypt their own survey response for verification.

### Access Control Pattern

```solidity
// Encrypt the value
euint8 encrypted = FHE.asEuint8(plaintext);

// Grant contract access
FHE.allowThis(encrypted);

// Grant user access
FHE.allow(encrypted, user_address);
```

## 2. Encrypted Input

### Encryption Process

Converting plaintext data to encrypted form before storage.

```solidity
// Input: plaintext rating (1-5)
uint8 rating = 4;

// Encrypt to euint8
euint8 encryptedRating = FHE.asEuint8(rating);

// Store encrypted value
survey.encryptedResponses[questionId].push(encryptedRating);
```

### Encryption Types

| Type | Range | Use Case |
|------|-------|----------|
| euint8 | 0-255 | Small values (ratings 1-5) |
| euint16 | 0-65535 | Medium values (balances) |
| euint32 | 0-4B | Large values (amounts) |
| euint64 | 0-18B | Very large values |

### Input Validation

Always validate input before encryption to ensure data integrity:

```solidity
require(rating >= 1 && rating <= 5, "Rating must be 1-5");
euint8 encrypted = FHE.asEuint8(rating);
```

## 3. Homomorphic Arithmetic

### FHE.add()

Performs addition on encrypted values without decryption.

```solidity
euint8 sum = FHE.add(encrypted1, encrypted2);
// Result is still encrypted!
```

### Benefits

- **Privacy Preserved:** Values never exposed during computation
- **Security:** Intermediate results remain encrypted
- **Aggregation:** Can compute statistics on encrypted data

### Example: Calculating Encrypted Sum

```solidity
// Start with first encrypted rating
euint8 encryptedSum = responses[0];

// Add all other encrypted ratings
for (uint256 i = 1; i < responses.length; i++) {
    encryptedSum = FHE.add(encryptedSum, responses[i]);
}

// encryptedSum is now encrypted total of all ratings
```

### Limitations

Not all operations are homomorphic:
- ✅ Addition (FHE.add)
- ✅ Subtraction (FHE.sub)
- ✅ Multiplication (by plaintext)
- ❌ Division (not supported)
- ❌ Comparison (requires special operations)

## 4. Public Decryption

### Decryption Request

Initiating decryption of aggregated results.

```solidity
// Prepare encrypted values for decryption
bytes32[] memory cts = new bytes32[](2);
cts[0] = FHE.toBytes32(encryptedSum);
cts[1] = FHE.toBytes32(encryptedCount);

// Request decryption with callback
FHE.requestDecryption(cts, this.processResults.selector);
```

### Callback Pattern

```solidity
function processResults(
    uint256 requestId,
    uint8 decryptedSum,
    uint8 decryptedCount
) external {
    // Process decrypted values
    uint8 average = decryptedSum / decryptedCount;
    // Store result
    questionResults[surveyId][questionId] = DecryptedResult({
        averageRating: average,
        totalResponses: decryptedCount,
        revealed: true
    });
}
```

### Key Points

- Decryption is **asynchronous** (happens off-chain via relayer)
- Only **aggregated results** are decrypted (not individual values)
- Callback provides decrypted data to the contract

## Privacy Guarantees

### What's Private

✅ Individual survey responses - Encrypted throughout lifecycle
✅ User identity - Only wallet address is visible on-chain
✅ Response content - Cannot be inferred from encrypted storage

### What's Not Private

❌ Participation - Submitting response is visible on-chain
❌ Response count - Total number of responses is public
❌ Aggregated results - Final statistics are decrypted and public

## Security Model

### Threat Model

| Threat | Defense |
|--------|---------|
| Survey creator reading individual responses | FHE encryption prevents plaintext access |
| Blockchain validators viewing responses | Ciphertexts stored, not plaintext |
| Relayer learning response values | Only aggregated sum sent for decryption |
| Double voting | hasResponded mapping prevents duplicates |
| Invalid data | Input validation before encryption |

### Assumptions

- FHEVM cryptography is secure (based on Zama's research)
- Relayer is semi-trusted (doesn't store/leak decryption requests)
- Smart contract code is correctly implemented
- Participants keep their private keys secure

## Real-World Applications

### Employee Surveys
- Anonymous feedback on management
- Satisfaction surveys
- Engagement measurements

### Voting Systems
- Confidential polling
- Sealed-bid elections
- Anonymous consensus gathering

### Data Aggregation
- Privacy-preserving analytics
- Confidential statistics
- Secure measurements

## Further Learning

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Homomorphic Encryption Basics](https://fhe.org)
- [Smart Contract Security](https://consensys.github.io/smart-contract-best-practices/)

---

For implementation examples, see [contracts/EmployeePrivacySurvey.sol](../contracts/EmployeePrivacySurvey.sol).
