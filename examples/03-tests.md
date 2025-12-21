# Test Coverage

## Overview

The Employee Privacy Survey test suite includes **90+ comprehensive test cases** covering:
- Survey creation and management
- Encrypted response submission
- Access control verification
- Homomorphic arithmetic operations
- Decryption workflows
- Error handling and anti-patterns
- Edge cases and boundary conditions

## Test Organization

### Survey Creation & Metadata (10+ tests)
- Survey creation with valid parameters
- Question retrieval
- Survey count tracking
- Title validation
- Question count validation
- Duration validation

### Encrypted Responses & Access Control (15+ tests)
- Encrypted response submission with proper permissions
- Duplicate response prevention
- Rating value validation (1-5 range)
- Answer count matching
- Survey expiration handling
- Multiple respondent support

### Survey Lifecycle (8+ tests)
- Survey closure and response blocking
- Creator-only operations
- Results publication
- Results publication validation
- Results publication prevention on duplicate calls

### Encrypted Arithmetic & Aggregation (10+ tests)
- Decryption request validation
- Response publishing requirements
- Question index validation
- Aggregation completeness

### Error Handling & Anti-patterns (25+ tests)
- Empty survey titles
- Missing questions
- Invalid rating values
- Already responded checks
- Survey expiration enforcement
- Unauthorized access attempts

### Edge Cases (10+ tests)
- Boundary conditions
- Empty surveys
- Large response counts
- Concurrent operations
- Permission edge cases

## Running Tests

```bash
# Run all tests
npm run test

# Run specific test suite
npx hardhat test --grep "Survey Creation"

# Run single test
npx hardhat test --grep "should create a new survey"

# Run with gas reporting
REPORT_GAS=true npm run test

# Generate coverage report
npm run coverage
```

## Test Patterns

### Survey Setup
```typescript
beforeEach(async function () {
  const questions = ["Question 1", "Question 2"];
  await surveyContract
    .connect(signers.creator)
    .createSurvey("Title", "Description", questions, 7);
});
```

### Encrypted Response
```typescript
const ratings = [5, 4]; // 1-5 scale
await surveyContract
  .connect(signers.employee)
  .submitResponse(surveyId, ratings);
```

### Verification
```typescript
const hasResponded = await surveyContract.hasResponded(surveyId, address);
expect(hasResponded).to.be.true;
```

## FHEVM Testing Concepts

### Mock Environment Check
```typescript
if (!fhevm.isMock) {
  this.skip();
}
```

### Encrypted Value Verification
Tests verify that:
- Encrypted values are properly stored
- Decryption permissions are set correctly
- Operations on encrypted data don't leak plaintext

---

For the complete test suite, see [../test/EmployeePrivacySurvey.ts](../test/EmployeePrivacySurvey.ts).
