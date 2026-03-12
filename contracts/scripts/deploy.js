const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const Contract = await hre.ethers.getContractFactory("MedicalRecords");
  console.log("Deploying MedicalRecords...");
  const contract = await Contract.deploy();

  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("MedicalRecords deployed to:", address);

  // Save the contract address to a local file for the frontend to pick up easily
  const addressPath = path.join(__dirname, "..", "contract-address.json");
  fs.writeFileSync(addressPath, JSON.stringify({ MedicalRecords: address }, null, 2));
  console.log(`Saved contract address to ${addressPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
