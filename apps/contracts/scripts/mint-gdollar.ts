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
 * Mint test Good Dollar (G$) tokens to an address
 * 
 * Usage:
 *   GDOLLAR_ADDRESS=0x... RECIPIENT_ADDRESS=0x... AMOUNT=1000000 npx hardhat run scripts/mint-gdollar.ts --network sepolia
 */
async function main() {
  // Get G$ token address from environment
  const gDollarAddress = process.env.GDOLLAR_ADDRESS;
  
  if (!gDollarAddress) {
    console.error("❌ Error: GDOLLAR_ADDRESS environment variable not set");
    console.error("   Set it to the deployed G$ token address");
    console.error("   Example: GDOLLAR_ADDRESS=0x... npx hardhat run scripts/mint-gdollar.ts --network sepolia");
    process.exit(1);
  }

  // Get recipient address and amount from command line args or use defaults
  const recipientAddress = process.env.RECIPIENT_ADDRESS || process.argv.find(arg => arg.startsWith("--address"))?.split("=")[1];
  const amount = process.env.AMOUNT || process.argv.find(arg => arg.startsWith("--amount"))?.split("=")[1] || "1000000";

  // Get signer (same pattern as deploy script)
  let signers = await ethers.getSigners();
  let deployer;
  
  if (signers.length === 0) {
    if (!process.env.PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY not found in environment. Make sure .env file exists in apps/contracts/ with PRIVATE_KEY=0x...");
    }
    const privateKey = process.env.PRIVATE_KEY.startsWith("0x") 
      ? process.env.PRIVATE_KEY 
      : "0x" + process.env.PRIVATE_KEY;
    deployer = new ethers.Wallet(privateKey, ethers.provider);
  } else {
    deployer = signers[0];
  }

  const recipient = recipientAddress || deployer.address;

  console.log("🪙 Minting test Good Dollar (G$) tokens...\n");
  console.log("Token address:", gDollarAddress);
  console.log("Recipient:", recipient);
  console.log("Amount:", amount, "G$\n");

  const MockERC20 = await ethers.getContractFactory("MockERC20", deployer);
  const gDollar = MockERC20.attach(gDollarAddress);

  // Parse amount (assuming 18 decimals)
  const amountInWei = ethers.parseEther(amount);

  console.log("Minting tokens...");
  const tx = await gDollar.mint(recipient, amountInWei);
  await tx.wait();

  const balance = await gDollar.balanceOf(recipient);
  console.log("\n✅ Tokens minted successfully!");
  console.log("   Recipient balance:", ethers.formatEther(balance), "G$");
  console.log("   Transaction hash:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

