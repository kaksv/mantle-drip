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

import { ethers } from "hardhat";

/**
 * Deploy a test Good Dollar (G$) token on Celo Sepolia for testing purposes
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-test-gdollar.ts --network sepolia
 */
async function main() {
  // Verify PRIVATE_KEY is available
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY not found in environment. Make sure .env file exists in apps/contracts/ with PRIVATE_KEY=0x...");
  }

  console.log("🚀 Deploying test Good Dollar (G$) token...\n");

  // Get network info
  const networkInfo = await ethers.provider.getNetwork();
  console.log("Network:", networkInfo.name, "Chain ID:", networkInfo.chainId.toString());

  // Try to get signers from Hardhat config first
  let signers = await ethers.getSigners();
  let deployer;
  
  if (signers.length === 0) {
    // If no signers from config, create wallet directly from PRIVATE_KEY
    if (!process.env.PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY not found in environment. Make sure .env file exists in apps/contracts/ with PRIVATE_KEY=0x...");
    }
    console.log("No signers from config, creating wallet from PRIVATE_KEY...");
    const privateKey = process.env.PRIVATE_KEY.startsWith("0x") 
      ? process.env.PRIVATE_KEY 
      : "0x" + process.env.PRIVATE_KEY;
    deployer = new ethers.Wallet(privateKey, ethers.provider);
    console.log("Created wallet from PRIVATE_KEY:", deployer.address);
  } else {
    deployer = signers[0];
  }

  console.log("Deploying with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "CELO\n");

  if (balance === 0n) {
    console.warn("⚠️  Warning: Deployer account has 0 CELO. You may need CELO for gas fees.\n");
  }

  // Deploy MockERC20 as Good Dollar
  // Make sure we use the deployer as a signer
  const MockERC20 = await ethers.getContractFactory("MockERC20", deployer);
  const gDollar = await MockERC20.deploy(
    "Good Dollar",  // name
    "G$",           // symbol
    18              // decimals
  );

  await gDollar.waitForDeployment();
  const address = await gDollar.getAddress();

  console.log("✅ Test Good Dollar (G$) deployed to:", address);
  console.log("   Name:", await gDollar.name());
  console.log("   Symbol:", await gDollar.symbol());
  console.log("   Decimals:", await gDollar.decimals());
  console.log("\n📝 Next steps:");
  console.log("   1. Update apps/web/src/lib/tokens/config.ts with this address for Sepolia");
  console.log("   2. Mint some tokens for testing: npx hardhat run scripts/mint-gdollar.ts --network sepolia");
  console.log("\n💡 To mint tokens to your address:");
  console.log(`   npx hardhat run scripts/mint-gdollar.ts --network sepolia --address ${deployer.address} --amount 1000000`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

