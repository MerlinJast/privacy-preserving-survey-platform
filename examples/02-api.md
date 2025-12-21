# API Reference

## EmployeePrivacySurvey Contract

### State Variables

```solidity
address public owner;              // Contract owner address
uint256 public surveyCounter;      // Total number of surveys created
mapping(uint256 => Survey) public surveys;  // Survey storage
mapping(uint256 => mapping(uint256 => DecryptedResult)) public questionResults;
```

### Events

#### SurveyCreated
```solidity
event SurveyCreated(
    uint256 indexed surveyId,
    address indexed creator,
    string title,
    uint256 endTime
)
```
Emitted when a new survey is created.

#### ResponseSubmitted
```solidity
event ResponseSubmitted(
    uint256 indexed surveyId,
    address indexed respondent,
    uint256 timestamp
)
```
Emitted when an employee submits encrypted responses.

#### ResultsPublished
```solidity
event ResultsPublished(
    uint256 indexed surveyId,
    uint256 totalResponses
)
```
Emitted when survey results are published.

#### ResultDecryptionRequested
```solidity
event ResultDecryptionRequested(
    uint256 indexed surveyId,
    uint256 indexed questionId,
    uint256 requestId
)
```
Emitted when decryption of results is requested.

### Functions

#### createSurvey
```solidity
function createSurvey(
    string memory _title,
    string memory _description,
    string[] memory _questions,
    uint256 _durationDays
) external returns (uint256)
```

**Parameters:**
- `_title`: Survey title (non-empty string)
- `_description`: Survey description
- `_questions`: Array of survey questions (at least one)
- `_durationDays`: Survey duration in days (positive integer)

**Returns:** Survey ID (uint256)

**Events:** Emits `SurveyCreated`

**Reverts:**
- "Title cannot be empty"
- "Must have at least one question"
- "Duration must be positive"

#### submitResponse
```solidity
function submitResponse(
    uint256 _surveyId,
    uint8[] memory _ratings
) external
```

**Parameters:**
- `_surveyId`: ID of the survey
- `_ratings`: Array of ratings (1-5 scale)

**Effects:**
- Encrypts each rating as euint8
- Stores encrypted responses
- Sets FHE permissions (allowThis and allow)
- Marks respondent as participated
- Increments response counter

**Events:** Emits `ResponseSubmitted`

**Reverts:**
- "Already responded"
- "Answer count mismatch"
- "Rating must be between 1-5"
- "Survey not active"
- "Survey expired"

#### publishResults
```solidity
function publishResults(uint256 _surveyId) external
```

**Requirements:**
- Only survey creator can call
- Survey must be closed
- Results not already published
- At least one response received

**Events:** Emits `ResultsPublished`

**Reverts:**
- "Not survey creator"
- "Survey still active"
- "Results already published"
- "No responses"

#### requestQuestionAverage
```solidity
function requestQuestionAverage(
    uint256 _surveyId,
    uint256 _questionId
) external
```

**Requirements:**
- Only survey creator can call
- Results must be published
- Valid question index
- Responses exist for question

**Events:** Emits `ResultDecryptionRequested`

**Operations:**
- Computes encrypted sum using FHE.add()
- Requests decryption via relayer
- Triggers callback with decrypted values

#### closeSurvey
```solidity
function closeSurvey(uint256 _surveyId) external
```

**Requirements:** Only survey creator can call

**Effects:** Sets survey active status to false

#### Query Functions

##### getSurvey
```solidity
function getSurvey(uint256 _surveyId) external view returns (
    address creator,
    string memory title,
    string memory description,
    uint256 startTime,
    uint256 endTime,
    bool active,
    bool resultsPublished,
    uint256 totalResponses
)
```

##### getSurveyQuestions
```solidity
function getSurveyQuestions(uint256 _surveyId) external view returns (string[] memory)
```

##### hasResponded
```solidity
function hasResponded(uint256 _surveyId, address _employee) external view returns (bool)
```

##### getCurrentSurveyInfo
```solidity
function getCurrentSurveyInfo(uint256 _surveyId) external view returns (
    bool active,
    bool resultsPublished,
    uint256 totalResponses,
    uint256 questionsCount,
    uint256 timeRemaining
)
```

##### getQuestionResult
```solidity
function getQuestionResult(uint256 _surveyId, uint256 _questionId) external view returns (
    uint8 averageRating,
    uint8 totalResponses,
    bool revealed
)
```

##### getTotalSurveys
```solidity
function getTotalSurveys() external view returns (uint256)
```

---

For usage examples, see [test/EmployeePrivacySurvey.ts](../test/EmployeePrivacySurvey.ts).
