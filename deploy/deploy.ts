import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * @title EmployeePrivacySurvey Deployment Script
 * @notice This script deploys the EmployeePrivacySurvey contract to the network
 * @dev Uses hardhat-deploy for deterministic deployments
 */

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying EmployeePrivacySurvey contract...");
  console.log("Deployer address:", deployer);

  const deployedSurveyContract = await deploy("EmployeePrivacySurvey", {
    from: deployer,
    log: true,
  });

  console.log(`EmployeePrivacySurvey contract deployed at: ${deployedSurveyContract.address}`);
  console.log("---");

  // Display deployment summary
  if (deployedSurveyContract.newlyDeployed) {
    console.log(
      `Contract deployed successfully on ${hre.network.name} network`,
    );
  }
};

export default func;
func.id = "deploy_employee_privacy_survey"; // id required to prevent reexecution
func.tags = ["EmployeePrivacySurvey"];
