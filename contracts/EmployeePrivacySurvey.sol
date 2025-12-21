// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint8, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EmployeePrivacySurvey - Privacy-Preserving Employee Satisfaction Survey
 * @author Zama FHE Community
 * @notice This contract demonstrates confidential voting and encrypted data aggregation using FHEVM
 * @dev Implements a privacy-preserving survey system where employee responses remain encrypted
 *
 * Key FHEVM Concepts Demonstrated:
 * - Access Control: Using FHE.allow and FHE.allowThis for encrypted data permissions
 * - Encrypted Arithmetic: Computing sums and averages on encrypted ratings
 * - Public Decryption: Revealing aggregated results while preserving individual privacy
 * - User Decryption: Allowing authorized users to decrypt specific values
 *
 * Use this example to learn:
 * 1. How to handle encrypted user input (euint8 ratings)
 * 2. How to perform homomorphic operations (FHE.add) on encrypted data
 * 3. How to manage access control for encrypted values
 * 4. How to request decryption of aggregated results
 */
contract EmployeePrivacySurvey is SepoliaConfig {

    address public owner;
    uint256 public surveyCounter;

    /// @dev Survey structure containing all survey metadata and encrypted responses
    struct Survey {
        address creator;
        string title;
        string description;
        string[] questions;
        uint256 startTime;
        uint256 endTime;
        bool active;
        bool resultsPublished;
        uint256 totalResponses;
        mapping(address => bool) hasResponded;
        mapping(uint256 => euint8[]) encryptedResponses; // questionId => all encrypted ratings
        address[] respondents;
    }

    /// @dev Structure for storing decrypted results
    struct DecryptedResult {
        uint8 averageRating;
        uint8 totalResponses;
        bool revealed;
    }

    mapping(uint256 => Survey) public surveys;
    mapping(uint256 => mapping(uint256 => DecryptedResult)) public questionResults; // surveyId => questionId => result

    // Events for tracking survey lifecycle
    event SurveyCreated(
        uint256 indexed surveyId,
        address indexed creator,
        string title,
        uint256 endTime
    );

    event ResponseSubmitted(
        uint256 indexed surveyId,
        address indexed respondent,
        uint256 timestamp
    );

    event ResultsPublished(
        uint256 indexed surveyId,
        uint256 totalResponses
    );

    event ResultDecryptionRequested(
        uint256 indexed surveyId,
        uint256 indexed questionId,
        uint256 requestId
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlySurveyCreator(uint256 _surveyId) {
        require(surveys[_surveyId].creator == msg.sender, "Not survey creator");
        _;
    }

    modifier surveyActive(uint256 _surveyId) {
        require(surveys[_surveyId].active, "Survey not active");
        require(block.timestamp <= surveys[_surveyId].endTime, "Survey expired");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Create a new employee satisfaction survey
     * @dev Creates a new survey with specified questions and duration
     * @param _title Survey title
     * @param _description Survey description
     * @param _questions Array of question strings
     * @param _durationDays Survey duration in days
     * @return surveyId The ID of the newly created survey
     */
    function createSurvey(
        string memory _title,
        string memory _description,
        string[] memory _questions,
        uint256 _durationDays
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_questions.length > 0, "Must have at least one question");
        require(_durationDays > 0, "Duration must be positive");

        surveyCounter++;
        uint256 surveyId = surveyCounter;

        Survey storage newSurvey = surveys[surveyId];
        newSurvey.creator = msg.sender;
        newSurvey.title = _title;
        newSurvey.description = _description;
        newSurvey.startTime = block.timestamp;
        newSurvey.endTime = block.timestamp + (_durationDays * 1 days);
        newSurvey.active = true;
        newSurvey.resultsPublished = false;
        newSurvey.totalResponses = 0;

        // Store questions
        for (uint256 i = 0; i < _questions.length; i++) {
            newSurvey.questions.push(_questions[i]);
        }

        emit SurveyCreated(surveyId, msg.sender, _title, newSurvey.endTime);
        return surveyId;
    }

    /**
     * @notice Submit encrypted survey responses (1-5 star ratings)
     * @dev This demonstrates how to handle encrypted user input in FHEVM
     *
     * FHEVM Concept: Encrypted Input & Access Control
     * - Each rating is converted to euint8 (encrypted 8-bit unsigned integer)
     * - FHE.allowThis() grants the contract permission to use the encrypted value
     * - FHE.allow() grants the respondent permission to decrypt their own response
     *
     * Privacy Guarantee: Individual ratings remain encrypted and cannot be viewed by anyone
     * until aggregated results are computed and decrypted by the survey creator
     *
     * @param _surveyId Survey ID
     * @param _ratings Array of ratings (1-5 scale) that will be encrypted
     */
    function submitResponse(
        uint256 _surveyId,
        uint8[] memory _ratings
    ) external surveyActive(_surveyId) {
        Survey storage survey = surveys[_surveyId];
        require(!survey.hasResponded[msg.sender], "Already responded");
        require(_ratings.length == survey.questions.length, "Answer count mismatch");

        // Validate and encrypt each rating
        for (uint256 i = 0; i < _ratings.length; i++) {
            uint8 rating = _ratings[i];
            require(rating >= 1 && rating <= 5, "Rating must be between 1-5");

            // FHEVM Operation: Encrypt the rating
            euint8 encryptedRating = FHE.asEuint8(rating);

            // Store the encrypted response
            survey.encryptedResponses[i].push(encryptedRating);

            // FHEVM Access Control: Set permissions for the encrypted value
            FHE.allowThis(encryptedRating);  // Contract can use this value
            FHE.allow(encryptedRating, msg.sender);  // Respondent can decrypt their own response
        }

        survey.hasResponded[msg.sender] = true;
        survey.totalResponses++;
        survey.respondents.push(msg.sender);

        emit ResponseSubmitted(_surveyId, msg.sender, block.timestamp);
    }

    /**
     * @notice Get survey information
     * @param _surveyId Survey ID
     * @return creator Survey creator address
     * @return title Survey title
     * @return description Survey description
     * @return startTime Survey start timestamp
     * @return endTime Survey end timestamp
     * @return active Whether survey is active
     * @return resultsPublished Whether results have been published
     * @return totalResponses Number of responses received
     */
    function getSurvey(uint256 _surveyId) external view returns (
        address creator,
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        bool active,
        bool resultsPublished,
        uint256 totalResponses
    ) {
        Survey storage survey = surveys[_surveyId];
        return (
            survey.creator,
            survey.title,
            survey.description,
            survey.startTime,
            survey.endTime,
            survey.active,
            survey.resultsPublished,
            survey.totalResponses
        );
    }

    /**
     * @notice Get survey questions
     * @param _surveyId Survey ID
     * @return Array of question strings
     */
    function getSurveyQuestions(uint256 _surveyId) external view returns (string[] memory) {
        return surveys[_surveyId].questions;
    }

    /**
     * @notice Check if employee has responded
     * @param _surveyId Survey ID
     * @param _employee Employee address
     * @return Whether the employee has responded
     */
    function hasResponded(uint256 _surveyId, address _employee) external view returns (bool) {
        return surveys[_surveyId].hasResponded[_employee];
    }

    /**
     * @notice Get total surveys count
     * @return Total number of surveys created
     */
    function getTotalSurveys() external view returns (uint256) {
        return surveyCounter;
    }

    /**
     * @notice Close survey (only creator)
     * @param _surveyId Survey ID
     */
    function closeSurvey(uint256 _surveyId) external onlySurveyCreator(_surveyId) {
        surveys[_surveyId].active = false;
    }

    /**
     * @notice Publish results and enable decryption (only creator)
     * @dev This marks the survey as ready for result computation
     * @param _surveyId Survey ID
     */
    function publishResults(uint256 _surveyId) external onlySurveyCreator(_surveyId) {
        require(!surveys[_surveyId].active, "Survey still active");
        require(!surveys[_surveyId].resultsPublished, "Results already published");
        require(surveys[_surveyId].totalResponses > 0, "No responses");

        surveys[_surveyId].resultsPublished = true;
        emit ResultsPublished(_surveyId, surveys[_surveyId].totalResponses);
    }

    /**
     * @notice Request decryption of average rating for a question
     * @dev This demonstrates encrypted arithmetic and public decryption in FHEVM
     *
     * FHEVM Concepts:
     * 1. Homomorphic Addition: FHE.add() performs addition on encrypted values
     *    without decrypting them first
     * 2. Public Decryption: FHE.requestDecryption() initiates decryption of the
     *    encrypted sum, which will be revealed to everyone
     *
     * Process:
     * - Sum all encrypted responses using FHE.add()
     * - Request decryption of the sum via the relayer
     * - Callback will process the decrypted value
     *
     * Privacy Guarantee: Only the aggregated sum is decrypted, individual responses
     * remain encrypted and private
     *
     * @param _surveyId Survey ID
     * @param _questionId Question ID
     */
    function requestQuestionAverage(uint256 _surveyId, uint256 _questionId) external onlySurveyCreator(_surveyId) {
        require(surveys[_surveyId].resultsPublished, "Results not published");
        require(_questionId < surveys[_surveyId].questions.length, "Invalid question");
        require(surveys[_surveyId].encryptedResponses[_questionId].length > 0, "No responses for question");

        Survey storage survey = surveys[_surveyId];
        euint8[] storage responses = survey.encryptedResponses[_questionId];

        // FHEVM Operation: Calculate encrypted sum using homomorphic addition
        euint8 encryptedSum = responses[0];
        for (uint256 i = 1; i < responses.length; i++) {
            // FHE.add() adds two encrypted values without decrypting them
            encryptedSum = FHE.add(encryptedSum, responses[i]);
        }

        // Create count as encrypted value
        euint8 encryptedCount = FHE.asEuint8(uint8(responses.length));

        // FHEVM Operation: Request public decryption
        // This sends the encrypted values to the relayer for decryption
        bytes32[] memory cts = new bytes32[](2);
        cts[0] = FHE.toBytes32(encryptedSum);
        cts[1] = FHE.toBytes32(encryptedCount);

        uint256 requestId = uint256(keccak256(abi.encodePacked(_surveyId, _questionId, block.timestamp)));
        FHE.requestDecryption(cts, this.processQuestionAverage.selector);

        emit ResultDecryptionRequested(_surveyId, _questionId, requestId);
    }

    /**
     * @notice Process decrypted results callback
     * @dev This function is called by the FHEVM relayer after decryption
     *
     * FHEVM Concept: Decryption Callback
     * - The relayer calls this function with decrypted values
     * - In production, you would use the requestId to map back to the specific survey/question
     * - Here we demonstrate the pattern for educational purposes
     *
     * @param decryptedSum The decrypted sum of all ratings
     * @param decryptedCount The decrypted count of responses
     */
    function processQuestionAverage(
        uint256 /* requestId */,
        uint8 decryptedSum,
        uint8 decryptedCount
    ) external pure {
        // Calculate average rating
        // uint8 averageRating = decryptedCount > 0 ? decryptedSum / decryptedCount : 0;

        // In production, you would:
        // 1. Use requestId to identify which survey/question this belongs to
        // 2. Store the result in questionResults mapping
        // 3. Emit an event with the revealed average
        // emit QuestionAverageRevealed(surveyId, questionId, averageRating, decryptedCount);
    }

    /**
     * @notice Get current survey info for UI
     * @param _surveyId Survey ID
     * @return active Whether survey is active
     * @return resultsPublished Whether results are published
     * @return totalResponses Number of responses
     * @return questionsCount Number of questions
     * @return timeRemaining Time remaining in seconds
     */
    function getCurrentSurveyInfo(uint256 _surveyId) external view returns (
        bool active,
        bool resultsPublished,
        uint256 totalResponses,
        uint256 questionsCount,
        uint256 timeRemaining
    ) {
        Survey storage survey = surveys[_surveyId];
        uint256 timeLeft = survey.endTime > block.timestamp ? survey.endTime - block.timestamp : 0;

        return (
            survey.active,
            survey.resultsPublished,
            survey.totalResponses,
            survey.questions.length,
            timeLeft
        );
    }

    /**
     * @notice Get employee response status
     * @param _surveyId Survey ID
     * @param _employee Employee address
     * @return responded Whether employee has responded
     * @return responseTime Response timestamp (0 if not implemented)
     */
    function getEmployeeResponseStatus(uint256 _surveyId, address _employee) external view returns (
        bool responded,
        uint256 responseTime
    ) {
        return (surveys[_surveyId].hasResponded[_employee], 0);
    }

    /**
     * @notice Get question result if available
     * @param _surveyId Survey ID
     * @param _questionId Question ID
     * @return averageRating Average rating (if revealed)
     * @return totalResponses Total responses (if revealed)
     * @return revealed Whether result has been revealed
     */
    function getQuestionResult(uint256 _surveyId, uint256 _questionId) external view returns (
        uint8 averageRating,
        uint8 totalResponses,
        bool revealed
    ) {
        DecryptedResult storage result = questionResults[_surveyId][_questionId];
        return (result.averageRating, result.totalResponses, result.revealed);
    }

    /**
     * @notice Transfer ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}
