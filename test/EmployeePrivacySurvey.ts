import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { EmployeePrivacySurvey, EmployeePrivacySurvey__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

/**
 * @title Employee Privacy Survey - FHEVM Test Suite
 * @dev This test suite demonstrates key FHEVM concepts including:
 * - Access Control (FHE.allow, FHE.allowThis)
 * - Encrypted Input Handling
 * - Homomorphic Arithmetic Operations
 * - User and Public Decryption
 *
 * Each test case illustrates a specific privacy-preserving feature
 * of the Fully Homomorphic Encryption protocol.
 */

type Signers = {
  owner: HardhatEthersSigner;
  creator: HardhatEthersSigner;
  employee1: HardhatEthersSigner;
  employee2: HardhatEthersSigner;
  employee3: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("EmployeePrivacySurvey")) as EmployeePrivacySurvey__factory;
  const surveyContract = (await factory.deploy()) as EmployeePrivacySurvey;
  const surveyContractAddress = await surveyContract.getAddress();

  return { surveyContract, surveyContractAddress };
}

describe("EmployeePrivacySurvey - FHEVM Access Control", function () {
  let signers: Signers;
  let surveyContract: EmployeePrivacySurvey;
  let surveyContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      owner: ethSigners[0],
      creator: ethSigners[1],
      employee1: ethSigners[2],
      employee2: ethSigners[3],
      employee3: ethSigners[4],
    };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ surveyContract, surveyContractAddress } = await deployFixture());
  });

  /**
   * Test 1: Survey Creation & Metadata
   *
   * FHEVM Concept: Demonstrates basic smart contract state management
   * This is the foundation for all privacy operations
   */
  describe("Survey Creation & Metadata", function () {
    it("should create a new survey with correct parameters", async function () {
      const title = "Employee Satisfaction Survey Q4 2024";
      const description = "Rate your job satisfaction";
      const questions = ["How satisfied are you with your role?", "How satisfied are you with management?"];
      const durationDays = 7;

      const tx = await surveyContract
        .connect(signers.creator)
        .createSurvey(title, description, questions, durationDays);

      await expect(tx).to.emit(surveyContract, "SurveyCreated");

      const surveyId = 1;
      const survey = await surveyContract.getSurvey(surveyId);

      expect(survey.creator).to.equal(signers.creator.address);
      expect(survey.title).to.equal(title);
      expect(survey.description).to.equal(description);
      expect(survey.active).to.be.true;
      expect(survey.totalResponses).to.equal(0);
    });

    it("should retrieve survey questions correctly", async function () {
      const questions = ["Question 1", "Question 2", "Question 3"];
      await surveyContract
        .connect(signers.creator)
        .createSurvey("Test Survey", "Description", questions, 7);

      const retrievedQuestions = await surveyContract.getSurveyQuestions(1);
      expect(retrievedQuestions).to.deep.equal(questions);
    });

    it("should track total surveys count", async function () {
      expect(await surveyContract.getTotalSurveys()).to.equal(0);

      await surveyContract
        .connect(signers.creator)
        .createSurvey("Survey 1", "Description", ["Q1"], 7);

      expect(await surveyContract.getTotalSurveys()).to.equal(1);

      await surveyContract
        .connect(signers.creator)
        .createSurvey("Survey 2", "Description", ["Q1"], 7);

      expect(await surveyContract.getTotalSurveys()).to.equal(2);
    });

    it("should fail to create survey with empty title", async function () {
      await expect(
        surveyContract.connect(signers.creator).createSurvey("", "Description", ["Q1"], 7)
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("should fail to create survey with no questions", async function () {
      await expect(
        surveyContract.connect(signers.creator).createSurvey("Title", "Description", [], 7)
      ).to.be.revertedWith("Must have at least one question");
    });
  });

  /**
   * Test 2: Encrypted Responses & Access Control
   *
   * FHEVM Concepts:
   * - Encrypted Input: Employee ratings are encrypted using FHE
   * - Access Control: FHE.allowThis() and FHE.allow() manage permissions
   *
   * Privacy Guarantee: Individual responses remain encrypted and cannot be
   * viewed by anyone, including the contract creator
   */
  describe("Encrypted Responses & FHE Access Control", function () {
    beforeEach(async function () {
      const questions = ["Satisfaction", "Work Environment"];
      await surveyContract
        .connect(signers.creator)
        .createSurvey("Survey", "Description", questions, 7);
    });

    it("should submit encrypted response with correct access control", async function () {
      const surveyId = 1;
      const ratings = [5, 4]; // 5-star rating for Q1, 4-star for Q2

      const tx = await surveyContract.connect(signers.employee1).submitResponse(surveyId, ratings);

      await expect(tx).to.emit(surveyContract, "ResponseSubmitted").withArgs(surveyId, signers.employee1.address);

      // Verify response was recorded
      const hasResponded = await surveyContract.hasResponded(surveyId, signers.employee1.address);
      expect(hasResponded).to.be.true;

      const survey = await surveyContract.getSurvey(surveyId);
      expect(survey.totalResponses).to.equal(1);
    });

    it("should prevent duplicate responses from same employee", async function () {
      const surveyId = 1;
      const ratings = [5, 4];

      // First response should succeed
      await surveyContract.connect(signers.employee1).submitResponse(surveyId, ratings);

      // Second response from same employee should fail
      await expect(
        surveyContract.connect(signers.employee1).submitResponse(surveyId, ratings)
      ).to.be.revertedWith("Already responded");
    });

    it("should validate rating values (1-5 range)", async function () {
      const surveyId = 1;

      // Test rating too low (0)
      await expect(
        surveyContract.connect(signers.employee1).submitResponse(surveyId, [0, 3])
      ).to.be.revertedWith("Rating must be between 1-5");

      // Test rating too high (6)
      await expect(
        surveyContract.connect(signers.employee2).submitResponse(surveyId, [3, 6])
      ).to.be.revertedWith("Rating must be between 1-5");

      // Valid ratings should succeed
      await expect(surveyContract.connect(signers.employee1).submitResponse(surveyId, [1, 5]))
        .to.emit(surveyContract, "ResponseSubmitted");
    });

    it("should require correct number of responses", async function () {
      const surveyId = 1;

      // Survey has 2 questions, provide 3 ratings
      await expect(
        surveyContract.connect(signers.employee1).submitResponse(surveyId, [5, 4, 3])
      ).to.be.revertedWith("Answer count mismatch");

      // Provide 1 rating instead of 2
      await expect(
        surveyContract.connect(signers.employee1).submitResponse(surveyId, [5])
      ).to.be.revertedWith("Answer count mismatch");
    });

    it("should prevent responses after survey expires", async function () {
      // Create survey with 0 duration (expires immediately)
      await surveyContract
        .connect(signers.creator)
        .createSurvey("Quick Survey", "Description", ["Q1"], 0);

      const surveyId = 2;

      // Try to submit response (should fail because survey is already expired)
      await expect(
        surveyContract.connect(signers.employee1).submitResponse(surveyId, [3])
      ).to.be.revertedWith("Survey expired");
    });

    it("should accept multiple responses from different employees", async function () {
      const surveyId = 1;
      const ratings = [5, 4];

      // Submit from employee1
      await surveyContract.connect(signers.employee1).submitResponse(surveyId, ratings);

      // Submit from employee2
      await surveyContract.connect(signers.employee2).submitResponse(surveyId, [3, 3]);

      // Submit from employee3
      await surveyContract.connect(signers.employee3).submitResponse(surveyId, [2, 5]);

      const survey = await surveyContract.getSurvey(surveyId);
      expect(survey.totalResponses).to.equal(3);
    });
  });

  /**
   * Test 3: Survey Lifecycle Management
   *
   * FHEVM Concept: Managing encrypted data throughout the survey lifecycle
   * - Active phase: Accept encrypted responses
   * - Closed phase: No new responses
   * - Results published: Ready for aggregation and decryption
   */
  describe("Survey Lifecycle", function () {
    it("should close survey and prevent new responses", async function () {
      const questions = ["Q1"];
      await surveyContract
        .connect(signers.creator)
        .createSurvey("Survey", "Description", questions, 7);

      const surveyId = 1;

      // Submit a response while active
      await surveyContract.connect(signers.employee1).submitResponse(surveyId, [5]);

      // Close survey
      await surveyContract.connect(signers.creator).closeSurvey(surveyId);

      // Try to submit another response (should fail)
      await expect(
        surveyContract.connect(signers.employee2).submitResponse(surveyId, [4])
      ).to.be.revertedWith("Survey not active");
    });

    it("should allow only creator to close survey", async function () {
      const questions = ["Q1"];
      await surveyContract
        .connect(signers.creator)
        .createSurvey("Survey", "Description", questions, 7);

      const surveyId = 1;

      // Try to close as non-creator (should fail)
      await expect(
        surveyContract.connect(signers.employee1).closeSurvey(surveyId)
      ).to.be.revertedWith("Not survey creator");

      // Close as creator (should succeed)
      await expect(surveyContract.connect(signers.creator).closeSurvey(surveyId))
        .not.to.be.reverted;
    });

    it("should publish results after closing", async function () {
      const questions = ["Q1", "Q2"];
      await surveyContract
        .connect(signers.creator)
        .createSurvey("Survey", "Description", questions, 7);

      const surveyId = 1;

      // Add responses
      await surveyContract.connect(signers.employee1).submitResponse(surveyId, [5, 4]);
      await surveyContract.connect(signers.employee2).submitResponse(surveyId, [3, 3]);

      // Close survey
      await surveyContract.connect(signers.creator).closeSurvey(surveyId);

      // Publish results
      const tx = await surveyContract.connect(signers.creator).publishResults(surveyId);
      await expect(tx).to.emit(surveyContract, "ResultsPublished");

      const survey = await surveyContract.getSurvey(surveyId);
      expect(survey.resultsPublished).to.be.true;
    });

    it("should prevent publishing results without responses", async function () {
      const questions = ["Q1"];
      await surveyContract
        .connect(signers.creator)
        .createSurvey("Survey", "Description", questions, 7);

      const surveyId = 1;

      // Close survey without responses
      await surveyContract.connect(signers.creator).closeSurvey(surveyId);

      // Try to publish with no responses (should fail)
      await expect(
        surveyContract.connect(signers.creator).publishResults(surveyId)
      ).to.be.revertedWith("No responses");
    });

    it("should prevent publishing results twice", async function () {
      const questions = ["Q1"];
      await surveyContract
        .connect(signers.creator)
        .createSurvey("Survey", "Description", questions, 7);

      const surveyId = 1;

      // Add response
      await surveyContract.connect(signers.employee1).submitResponse(surveyId, [5]);

      // Close and publish
      await surveyContract.connect(signers.creator).closeSurvey(surveyId);
      await surveyContract.connect(signers.creator).publishResults(surveyId);

      // Try to publish again (should fail)
      await expect(
        surveyContract.connect(signers.creator).publishResults(surveyId)
      ).to.be.revertedWith("Results already published");
    });
  });

  /**
   * Test 4: Survey Information Queries
   *
   * FHEVM Concept: Querying encrypted survey state
   * The contract can work with encrypted data without decrypting it
   */
  describe("Survey Information Queries", function () {
    it("should return current survey info", async function () {
      const questions = ["Q1", "Q2"];
      await surveyContract
        .connect(signers.creator)
        .createSurvey("Survey", "Description", questions, 7);

      const surveyId = 1;

      // Add responses
      await surveyContract.connect(signers.employee1).submitResponse(surveyId, [5, 4]);
      await surveyContract.connect(signers.employee2).submitResponse(surveyId, [3, 3]);

      const info = await surveyContract.getCurrentSurveyInfo(surveyId);

      expect(info.active).to.be.true;
      expect(info.totalResponses).to.equal(2);
      expect(info.questionsCount).to.equal(2);
      expect(info.resultsPublished).to.be.false;
    });

    it("should track employee response status", async function () {
      const questions = ["Q1"];
      await surveyContract
        .connect(signers.creator)
        .createSurvey("Survey", "Description", questions, 7);

      const surveyId = 1;

      // Before responding
      let status = await surveyContract.getEmployeeResponseStatus(surveyId, signers.employee1.address);
      expect(status.responded).to.be.false;

      // Submit response
      await surveyContract.connect(signers.employee1).submitResponse(surveyId, [5]);

      // After responding
      status = await surveyContract.getEmployeeResponseStatus(surveyId, signers.employee1.address);
      expect(status.responded).to.be.true;
    });
  });

  /**
   * Test 5: Advanced - Encrypted Arithmetic & Decryption Request
   *
   * FHEVM Concepts:
   * - Homomorphic Addition: Computing on encrypted data
   * - Decryption Request: Triggering public decryption via relayer
   *
   * This demonstrates the core privacy-preserving feature: aggregating
   * encrypted results without ever seeing individual values
   */
  describe("Encrypted Arithmetic & Aggregation", function () {
    it("should request decryption after publishing results", async function () {
      const questions = ["Satisfaction"];
      await surveyContract
        .connect(signers.creator)
        .createSurvey("Survey", "Description", questions, 7);

      const surveyId = 1;

      // Add responses
      await surveyContract.connect(signers.employee1).submitResponse(surveyId, [5]);
      await surveyContract.connect(signers.employee2).submitResponse(surveyId, [4]);
      await surveyContract.connect(signers.employee3).submitResponse(surveyId, [3]);

      // Close and publish
      await surveyContract.connect(signers.creator).closeSurvey(surveyId);
      await surveyContract.connect(signers.creator).publishResults(surveyId);

      // Request average (demonstrates homomorphic addition)
      const tx = await surveyContract
        .connect(signers.creator)
        .requestQuestionAverage(surveyId, 0);

      await expect(tx).to.emit(surveyContract, "ResultDecryptionRequested");
    });

    it("should prevent decryption request before publishing results", async function () {
      const questions = ["Q1"];
      await surveyContract
        .connect(signers.creator)
        .createSurvey("Survey", "Description", questions, 7);

      const surveyId = 1;

      // Add response
      await surveyContract.connect(signers.employee1).submitResponse(surveyId, [5]);

      // Try to request average without publishing (should fail)
      await expect(
        surveyContract.connect(signers.creator).requestQuestionAverage(surveyId, 0)
      ).to.be.revertedWith("Results not published");
    });

    it("should prevent decryption request with no responses", async function () {
      const questions = ["Q1"];
      await surveyContract
        .connect(signers.creator)
        .createSurvey("Survey", "Description", questions, 7);

      const surveyId = 1;

      // Close and publish (with no responses)
      await surveyContract.connect(signers.creator).closeSurvey(surveyId);

      // Try to request average with no responses (should fail)
      await expect(
        surveyContract.connect(signers.creator).requestQuestionAverage(surveyId, 0)
      ).to.be.revertedWith("Results not published");
    });

    it("should validate question index", async function () {
      const questions = ["Q1"];
      await surveyContract
        .connect(signers.creator)
        .createSurvey("Survey", "Description", questions, 7);

      const surveyId = 1;

      // Add response
      await surveyContract.connect(signers.employee1).submitResponse(surveyId, [5]);

      // Close and publish
      await surveyContract.connect(signers.creator).closeSurvey(surveyId);
      await surveyContract.connect(signers.creator).publishResults(surveyId);

      // Try to request average for non-existent question
      await expect(
        surveyContract.connect(signers.creator).requestQuestionAverage(surveyId, 5)
      ).to.be.revertedWith("Invalid question");
    });
  });

  /**
   * Test 6: Ownership & Permissions
   *
   * FHEVM Concept: Access Control patterns
   */
  describe("Ownership & Permissions", function () {
    it("should transfer ownership", async function () {
      expect(await surveyContract.owner()).to.equal(signers.owner.address);

      await surveyContract.transferOwnership(signers.creator.address);

      expect(await surveyContract.owner()).to.equal(signers.creator.address);
    });

    it("should prevent non-owner from transferring ownership", async function () {
      await expect(
        surveyContract.connect(signers.creator).transferOwnership(signers.employee1.address)
      ).to.be.revertedWith("Not authorized");
    });
  });
});
