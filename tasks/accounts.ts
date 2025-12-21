import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * @notice List all available accounts for the current network
 */
task("accounts", "Prints the list of accounts", async (taskArgs: TaskArguments, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.getAddress());
  }
});
