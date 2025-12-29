#!/usr/bin/env ts-node

/**
 * @title Lisk Sourcify Verification Helper Script
 * @notice Script to help verify contracts on Sourcify for Lisk Mainnet
 * @dev This script provides all the information needed for manual verification via Sourcify Web UI
 */

import * as fs from "fs";
import * as path from "path";

// Lisk Mainnet deployment addresses
const LISK_ADDRESSES = {
  DripCoreProxy: "0x87BcC4Ef6817d3137568Be91f019bC4e35d9A4b6",
  DripCoreImplementation: "0x50203ba83FB9Ce709Dd7Ddd4D335aEcdF532F31a",
  ProxyAdmin: "0x4F6Bee0bAf044F7124fE701ade99F049ef402a88",
  SubscriptionManager: "0x009AB24eC563d05cfD3345E6128cBaFAb8b62299",
};

const CHAIN_ID = 1135; // Lisk Mainnet
const COMPILER_VERSION = "0.8.20";
const OPTIMIZATION_ENABLED = true;
const OPTIMIZATION_RUNS = 200;
const VIA_IR = true;

interface VerificationInfo {
  name: string;
  address: string;
  sourceFiles: string[];
  constructorArgs?: string[];
  metadataPath?: string;
}

const contractsToVerify: VerificationInfo[] = [
  {
    name: "DripCore Implementation",
    address: LISK_ADDRESSES.DripCoreImplementation,
    sourceFiles: [
      "contracts/DripCore.sol",
      "contracts/interfaces/IDrip.sol",
      "contracts/utils/TokenHelper.sol",
      "contracts/interfaces/IERC20.sol",
      "contracts/libraries/DripTypes.sol",
    ],
    metadataPath: "artifacts/contracts/DripCore.sol/DripCore.json",
    // No constructor args (upgradeable contract)
  },
  {
    name: "SubscriptionManager",
    address: LISK_ADDRESSES.SubscriptionManager,
    sourceFiles: [
      "contracts/SubscriptionManager.sol",
      "contracts/interfaces/ISubscription.sol",
      "contracts/interfaces/IDrip.sol",
      "contracts/libraries/DripTypes.sol",
    ],
    metadataPath: "artifacts/contracts/SubscriptionManager.sol/SubscriptionManager.json",
    constructorArgs: [LISK_ADDRESSES.DripCoreProxy], // DripCore proxy address
  },
];

/**
 * Check if files exist
 */
function checkFilesExist(files: string[]): boolean {
  const basePath = process.cwd();
  for (const file of files) {
    const filePath = path.join(basePath, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${file}`);
      return false;
    }
  }
  return true;
}

/**
 * Display verification instructions
 */
function displayVerificationInstructions(contract: VerificationInfo): void {
  console.log("\n" + "=".repeat(80));
  console.log(`📋 Verification Instructions for: ${contract.name}`);
  console.log("=".repeat(80));
  console.log(`\n📍 Contract Address: ${contract.address}`);
  console.log(`🌐 Network: Lisk Mainnet (Chain ID: ${CHAIN_ID})`);
  console.log(`\n📝 Steps to Verify:`);
  console.log(`\n1. Go to: https://sourcify.dev`);
  console.log(`2. Click "Verify Contract" or navigate to verification page`);
  console.log(`3. Select "Lisk" network (Chain ID: 1135)`);
  console.log(`\n4. Enter Contract Address: ${contract.address}`);
  console.log(`\n5. Upload Source Files:`);
  contract.sourceFiles.forEach((file, index) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`   ${index + 1}. ${file}`);
    } else {
      console.log(`   ${index + 1}. ${file} ❌ NOT FOUND`);
    }
  });

  if (contract.metadataPath) {
    const metadataPath = path.join(process.cwd(), contract.metadataPath);
    if (fs.existsSync(metadataPath)) {
      console.log(`\n6. Upload Metadata File: ${contract.metadataPath}`);
    } else {
      console.log(`\n6. Upload Metadata File: ${contract.metadataPath} ❌ NOT FOUND`);
    }
  }

  console.log(`\n7. Enter Compiler Settings:`);
  console.log(`   - Solidity Version: ${COMPILER_VERSION}`);
  console.log(`   - Optimization: ${OPTIMIZATION_ENABLED ? "Enabled" : "Disabled"}`);
  console.log(`   - Optimization Runs: ${OPTIMIZATION_RUNS}`);
  console.log(`   - Via IR: ${VIA_IR}`);

  if (contract.constructorArgs && contract.constructorArgs.length > 0) {
    console.log(`\n8. Enter Constructor Arguments:`);
    console.log(`   - Array format: ["${contract.constructorArgs[0]}"]`);
    console.log(`   - Or ABI-encoded: ${encodeConstructorArgs(contract.constructorArgs[0])}`);
  } else {
    console.log(`\n8. Constructor Arguments: None (empty)`);
  }

  console.log(`\n9. Click "Verify"`);
  console.log(`\n🔗 Verification Links:`);
  console.log(`   Sourcify: https://sourcify.dev/#/lookup/${contract.address}`);
  console.log(`   Blockscout: https://blockscout.lisk.com/address/${contract.address}`);
  console.log("\n" + "=".repeat(80));
}

/**
 * Encode constructor argument (simple address encoding)
 */
function encodeConstructorArgs(address: string): string {
  // Remove 0x prefix and pad to 64 characters
  const cleanAddress = address.startsWith("0x") ? address.slice(2) : address;
  return "0x" + cleanAddress.toLowerCase().padStart(64, "0");
}

/**
 * Main function
 */
async function main() {
  console.log("🚀 Lisk Mainnet Sourcify Verification Helper");
  console.log("=".repeat(80));
  console.log("\nThis script provides instructions for verifying contracts on Sourcify.");
  console.log("Follow the instructions below for each contract.\n");

  // Check prerequisites
  console.log("📦 Checking prerequisites...");
  const basePath = process.cwd();
  const artifactsPath = path.join(basePath, "artifacts", "contracts");
  
  if (!fs.existsSync(artifactsPath)) {
    console.error("❌ Contracts not compiled. Please run: pnpm compile");
    process.exit(1);
  }
  console.log("✅ Contracts are compiled\n");

  // Display instructions for each contract
  for (const contract of contractsToVerify) {
    // Check if source files exist
    const allFiles = [...contract.sourceFiles];
    if (contract.metadataPath) {
      allFiles.push(contract.metadataPath);
    }

    if (checkFilesExist(allFiles)) {
      displayVerificationInstructions(contract);
    } else {
      console.error(`\n❌ Some files are missing for ${contract.name}`);
      console.error("Please ensure all source files are present and contracts are compiled.");
    }
  }

  console.log("\n📚 Additional Information:");
  console.log("   - Sourcify Documentation: https://docs.sourcify.dev");
  console.log("   - Lisk Explorer: https://blockscout.lisk.com");
  console.log("   - Network: Lisk Mainnet (Chain ID: 1135)");
  console.log("\n✨ Good luck with verification!");
}

// Run
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
