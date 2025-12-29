// Load environment variables FIRST, before importing hardhat
import * as fs from "fs";
import * as path from "path";

// Manually load .env file if dotenv is not available
if (!process.env.PRIVATE_KEY) {
  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

// Try dotenv as well
try {
  require("dotenv").config();
} catch (e) {
  // dotenv not available, we already loaded manually above
}

import { ethers, upgrades } from "hardhat";

/**
 * @notice Deploy DripCore with upgradeable proxy
 * @dev This script deploys DripCore implementation and sets up TransparentUpgradeableProxy
 */
async function main() {
  // Verify PRIVATE_KEY is available
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY not found in environment. Make sure .env file exists in apps/contracts/ with PRIVATE_KEY=0x...");
  }
  
  // Get network info
  const networkInfo = await ethers.provider.getNetwork();
  console.log("Network:", networkInfo.name, "Chain ID:", networkInfo.chainId.toString());
  
  // Try to get signers from Hardhat config first
  let signers = await ethers.getSigners();
  let deployer;
  
  if (signers.length === 0) {
    // If no signers from config, create wallet directly from PRIVATE_KEY
    console.log("No signers from config, creating wallet from PRIVATE_KEY...");
    const privateKey = process.env.PRIVATE_KEY.startsWith("0x") 
      ? process.env.PRIVATE_KEY 
      : "0x" + process.env.PRIVATE_KEY;
    deployer = new ethers.Wallet(privateKey, ethers.provider);
    console.log("Created wallet from PRIVATE_KEY:", deployer.address);
  } else {
    deployer = signers[0];
  }
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Get parameters from environment or use defaults
  const platformFeeRecipient = process.env.PLATFORM_FEE_RECIPIENT || deployer.address;
  const proxyAdmin = process.env.PROXY_ADMIN || deployer.address;

  console.log("\n=== Deployment Parameters ===");
  console.log("Platform Fee Recipient:", platformFeeRecipient);
  console.log("Proxy Admin:", proxyAdmin);
  console.log("============================\n");

  // Step 1: Deploy DripCore implementation
  console.log("Deploying DripCore implementation...");
  const DripCoreFactory = await ethers.getContractFactory("DripCore", deployer);
  
  // Deploy as upgradeable proxy
  const dripCore = await upgrades.deployProxy(
    DripCoreFactory.connect(deployer),
    [platformFeeRecipient, proxyAdmin], // initialize parameters
    {
      initializer: "initialize",
      kind: "transparent", // Use TransparentUpgradeableProxy
    }
  );

  await dripCore.waitForDeployment();
  const dripCoreAddress = await dripCore.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(dripCoreAddress);
  const adminAddress = await upgrades.erc1967.getAdminAddress(dripCoreAddress);

  console.log("✅ DripCore Proxy deployed to:", dripCoreAddress);
  console.log("   Implementation address:", implementationAddress);
  console.log("   Proxy Admin address:", adminAddress);

  // Step 2: Deploy SubscriptionManager
  console.log("\nDeploying SubscriptionManager...");
  const SubscriptionManagerFactory = await ethers.getContractFactory("SubscriptionManager", deployer);
  const subscriptionManager = await SubscriptionManagerFactory.connect(deployer).deploy(
    dripCoreAddress,
    platformFeeRecipient
  );
  await subscriptionManager.waitForDeployment();
  const subscriptionManagerAddress = await subscriptionManager.getAddress();

  console.log("✅ SubscriptionManager deployed to:", subscriptionManagerAddress);

  // Step 3: Save deployment addresses
  const chainId = networkInfo.chainId.toString();
  
  const deploymentInfo = {
    chainId: chainId,
    network: networkInfo.name,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      DripCore: {
        proxy: dripCoreAddress,
        implementation: implementationAddress,
        admin: adminAddress,
      },
      SubscriptionManager: subscriptionManagerAddress,
    },
    parameters: {
      platformFeeRecipient,
      proxyAdmin,
    },
  };

  // Save to file
  const deploymentDir = path.join(__dirname, "../ignition/deployments");
  const chainDir = path.join(deploymentDir, `chain-${chainId}`);
  
  if (!fs.existsSync(chainDir)) {
    fs.mkdirSync(chainDir, { recursive: true });
  }

  const deploymentFile = path.join(chainDir, "proxy-deployment.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n✅ Deployment info saved to:", deploymentFile);

  // Also update the deployed_addresses.json format for compatibility
  const addressesFile = path.join(chainDir, "deployed_addresses.json");
  const addresses = {
    [`DripProxyModule#DripCoreProxy`]: dripCoreAddress,
    [`DripProxyModule#DripCoreImplementation`]: implementationAddress,
    [`DripProxyModule#ProxyAdmin`]: adminAddress,
    [`DripProxyModule#SubscriptionManager`]: subscriptionManagerAddress,
  };
  fs.writeFileSync(addressesFile, JSON.stringify(addresses, null, 2));

  console.log("\n=== Deployment Summary ===");
  console.log("DripCore Proxy:", dripCoreAddress);
  console.log("DripCore Implementation:", implementationAddress);
  console.log("Proxy Admin:", adminAddress);
  console.log("SubscriptionManager:", subscriptionManagerAddress);
  console.log("========================");

  return deploymentInfo;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

