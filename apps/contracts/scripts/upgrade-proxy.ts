import { ethers, upgrades } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * @notice Upgrade DripCore proxy to a new implementation
 * @dev This script upgrades the existing proxy to a new implementation version
 * @param PROXY_ADDRESS The address of the existing proxy (set as environment variable)
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Upgrading proxy with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Get proxy address from environment or deployment file
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();
  const deploymentDir = path.join(__dirname, "../ignition/deployments");
  const chainDir = path.join(deploymentDir, `chain-${chainId}`);
  const deploymentFile = path.join(chainDir, "proxy-deployment.json");

  let proxyAddress: string;

  if (process.env.PROXY_ADDRESS) {
    proxyAddress = process.env.PROXY_ADDRESS;
  } else if (fs.existsSync(deploymentFile)) {
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
    proxyAddress = deploymentInfo.contracts.DripCore.proxy;
  } else {
    throw new Error(
      "Proxy address not found. Set PROXY_ADDRESS environment variable or ensure deployment file exists."
    );
  }

  console.log("\n=== Upgrade Parameters ===");
  console.log("Proxy Address:", proxyAddress);
  console.log("==========================\n");

  // Deploy new implementation
  console.log("Deploying new DripCore implementation...");
  const DripCoreFactory = await ethers.getContractFactory("DripCore");
  
  // Upgrade the proxy
  console.log("Upgrading proxy to new implementation...");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, DripCoreFactory, {
    kind: "transparent",
  });

  await upgraded.waitForDeployment();
  const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("✅ Proxy upgraded successfully!");
  console.log("   Proxy address (unchanged):", proxyAddress);
  console.log("   New implementation address:", newImplementationAddress);

  // Update deployment info
  if (fs.existsSync(deploymentFile)) {
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
    deploymentInfo.contracts.DripCore.implementation = newImplementationAddress;
    deploymentInfo.upgradedAt = new Date().toISOString();
    deploymentInfo.upgradedBy = deployer.address;
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n✅ Deployment info updated");
  }

  console.log("\n=== Upgrade Summary ===");
  console.log("Proxy Address:", proxyAddress);
  console.log("New Implementation:", newImplementationAddress);
  console.log("======================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

