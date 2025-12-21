import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * @title EmployeePrivacySurvey Custom Tasks
 * @notice Hardhat tasks for interacting with EmployeePrivacySurvey contract
 */

/**
 * Task: Get survey information
 * Usage: npx hardhat get-survey --survey-id 1 --network hardhat
 */
task("get-survey", "Get survey information")
  .addParam("surveyId", "The survey ID")
  .setAction(async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) => {
    const surveyId = taskArgs.surveyId as string;

    const contractAddress = (await hre.deployments.get("EmployeePrivacySurvey")).address;
    const contract = await hre.ethers.getContractAt("EmployeePrivacySurvey", contractAddress);

    const survey = await contract.getSurvey(surveyId);
    console.log("\n=== Survey Information ===");
    console.log("Creator:", survey.creator);
    console.log("Title:", survey.title);
    console.log("Description:", survey.description);
    console.log("Active:", survey.active);
    console.log("Results Published:", survey.resultsPublished);
    console.log("Total Responses:", survey.totalResponses.toString());
    console.log("Start Time:", new Date(Number(survey.startTime) * 1000).toISOString());
    console.log("End Time:", new Date(Number(survey.endTime) * 1000).toISOString());
  });

/**
 * Task: Get survey questions
 * Usage: npx hardhat get-questions --survey-id 1 --network hardhat
 */
task("get-questions", "Get survey questions")
  .addParam("surveyId", "The survey ID")
  .setAction(async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) => {
    const surveyId = taskArgs.surveyId as string;

    const contractAddress = (await hre.deployments.get("EmployeePrivacySurvey")).address;
    const contract = await hre.ethers.getContractAt("EmployeePrivacySurvey", contractAddress);

    const questions = await contract.getSurveyQuestions(surveyId);
    console.log("\n=== Survey Questions ===");
    questions.forEach((question: string, index: number) => {
      console.log(`${index + 1}. ${question}`);
    });
  });

/**
 * Task: Create a test survey
 * Usage: npx hardhat create-test-survey --network hardhat
 */
task("create-test-survey", "Create a test survey")
  .addParam("title", "Survey title", "Employee Satisfaction Survey", undefined, true)
  .addParam("duration", "Survey duration in days", "7", undefined, true)
  .setAction(async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) => {
    const [signer] = await hre.ethers.getSigners();

    const contractAddress = (await hre.deployments.get("EmployeePrivacySurvey")).address;
    const contract = await hre.ethers.getContractAt("EmployeePrivacySurvey", contractAddress);

    const title = taskArgs.title as string;
    const duration = taskArgs.duration as string;

    const questions = [
      "How satisfied are you with your current role?",
      "How satisfied are you with your manager and management?",
      "Do you feel valued and appreciated in your position?",
      "How would you rate the work environment and team collaboration?",
      "Would you recommend this company as a great place to work?",
    ];

    console.log("\nCreating test survey...");
    console.log("Title:", title);
    console.log("Duration:", duration, "days");
    console.log("Questions:", questions.length);

    const tx = await contract.createSurvey(
      title,
      "Privacy-preserving employee satisfaction survey using FHEVM",
      questions,
      duration,
    );

    const receipt = await tx.wait();
    console.log("✓ Survey created successfully!");
    console.log("Transaction hash:", receipt?.hash);
    console.log("Survey ID: 1");
  });

/**
 * Task: Submit encrypted response to survey
 * Usage: npx hardhat submit-response --survey-id 1 --ratings 5,4,3,4,5 --network hardhat
 */
task("submit-response", "Submit encrypted response to survey")
  .addParam("surveyId", "The survey ID")
  .addParam("ratings", "Comma-separated ratings (1-5)")
  .setAction(async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) => {
    const surveyId = taskArgs.surveyId as string;
    const ratingsStr = taskArgs.ratings as string;
    const ratings = ratingsStr.split(",").map((r: string) => parseInt(r.trim()));

    const [signer] = await hre.ethers.getSigners();

    const contractAddress = (await hre.deployments.get("EmployeePrivacySurvey")).address;
    const contract = await hre.ethers.getContractAt("EmployeePrivacySurvey", contractAddress);

    console.log("\nSubmitting encrypted response...");
    console.log("Survey ID:", surveyId);
    console.log("Ratings:", ratings);
    console.log("Respondent:", await signer.getAddress());

    const tx = await contract.submitResponse(surveyId, ratings);
    const receipt = await tx.wait();

    console.log("✓ Response submitted successfully!");
    console.log("Transaction hash:", receipt?.hash);
    console.log("Note: Your response has been encrypted using FHEVM");
  });

/**
 * Task: Get total surveys
 * Usage: npx hardhat get-total-surveys --network hardhat
 */
task("get-total-surveys", "Get total number of surveys", async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) => {
  const contractAddress = (await hre.deployments.get("EmployeePrivacySurvey")).address;
  const contract = await hre.ethers.getContractAt("EmployeePrivacySurvey", contractAddress);

  const total = await contract.getTotalSurveys();
  console.log("\nTotal surveys created:", total.toString());
});
