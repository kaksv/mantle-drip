/**
 * @title Sourcify Verification Script
 * @notice Script to verify contracts on Sourcify for Celo Mainnet
 * @dev This script helps prepare and verify contracts using Sourcify
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Mainnet deployment addresses
const MAINNET_ADDRESSES = {
  DripCoreProxy: "0x5530975fDe062FE6706298fF3945E3d1a17A310a",
  DripCoreImplementation: "0x8F4C50979efb901C50e79e11DdC2a45FD1451eE3",
  ProxyAdmin: "0x90FD81efC0bB74cca2997ebB6D77e5145788f481",
  SubscriptionManager: "0xBE3e232657233224F14b7b2a5625f69aF8F95054",
};

const CHAIN_ID = 42220; // Celo Mainnet
const COMPILER_VERSION = "0.8.20";
const OPTIMIZATION_ENABLED = true;
const OPTIMIZATION_RUNS = 200;
const VIA_IR = true;

interface VerificationConfig {
  name: string;
  address: string;
  sourceFiles: string[];
  constructorArgs?: string[];
  libraries?: Record<string, string>;
}

const contractsToVerify: VerificationConfig[] = [
  {
    name: "DripCore",
    address: MAINNET_ADDRESSES.DripCoreImplementation,
    sourceFiles: [
      "contracts/DripCore.sol",
      "contracts/interfaces/IDrip.sol",
      "contracts/utils/TokenHelper.sol",
      "contracts/interfaces/IERC20.sol",
    ],
    // No constructor args (upgradeable contract)
  },
  {
    name: "SubscriptionManager",
    address: MAINNET_ADDRESSES.SubscriptionManager,
    sourceFiles: [
      "contracts/SubscriptionManager.sol",
      "contracts/interfaces/ISubscription.sol",
      "contracts/interfaces/IDrip.sol",
    ],
    constructorArgs: [MAINNET_ADDRESSES.DripCoreProxy], // DripCore proxy address
  },
];

/**
 * Check if Sourcify CLI is installed
 */
function checkSourcifyCLI(): boolean {
  try {
    execSync("sourcify --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify a contract using Sourcify CLI
 */
function verifyContract(config: VerificationConfig): void {
  console.log(`\n🔍 Verifying ${config.name} at ${config.address}...`);

  const sourceFilesArgs = config.sourceFiles
    .map((file) => `--source-files ${file}`)
    .join(" ");

  const constructorArgs =
    config.constructorArgs && config.constructorArgs.length > 0
      ? `--constructor-args "${config.constructorArgs.join(" ")}"`
      : "";

  const libraries =
    config.libraries && Object.keys(config.libraries).length > 0
      ? `--libraries "${JSON.stringify(config.libraries)}"`
      : '--libraries ""';

  const command = `sourcify verify \\
    --chain-id ${CHAIN_ID} \\
    --contract-name ${config.name} \\
    --contract-address ${config.address} \\
    --compiler-version ${COMPILER_VERSION} \\
    --optimization ${OPTIMIZATION_ENABLED} \\
    --optimization-runs ${OPTIMIZATION_RUNS} \\
    ${sourceFilesArgs} \\
    ${constructorArgs} \\
    ${libraries}`;

  console.log(`\n📝 Command:\n${command}\n`);

  try {
    execSync(command, { stdio: "inherit", cwd: process.cwd() });
    console.log(`✅ ${config.name} verified successfully!`);
  } catch (error) {
    console.error(`❌ Failed to verify ${config.name}:`, error);
    throw error;
  }
}

/**
 * Generate verification metadata file
 */
function generateVerificationMetadata(): void {
  const metadata = {
    chainId: CHAIN_ID,
    network: "celo-mainnet",
    compiler: {
      version: COMPILER_VERSION,
      optimization: OPTIMIZATION_ENABLED,
      runs: OPTIMIZATION_RUNS,
      viaIR: VIA_IR,
    },
    contracts: contractsToVerify.map((config) => ({
      name: config.name,
      address: config.address,
      sourceFiles: config.sourceFiles,
      constructorArgs: config.constructorArgs || [],
    })),
    verificationUrls: {
      sourcify: `https://sourcify.dev/#/lookup/`,
      celoscan: `https://celoscan.io/address/`,
    },
  };

  const outputPath = path.join(process.cwd(), "sourcify-verification.json");
  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
  console.log(`\n📄 Verification metadata saved to: ${outputPath}`);
}

/**
 * Main verification function
 */
async function main() {
  console.log("🚀 Starting Sourcify Verification for Celo Mainnet\n");
  console.log("=" .repeat(60));

  // Check prerequisites
  console.log("\n1️⃣ Checking prerequisites...");
  
  if (!checkSourcifyCLI()) {
    console.error(
      "❌ Sourcify CLI not found. Please install it first:"
    );
    console.error("   npm install -g @sourcify/cli");
    process.exit(1);
  }
  console.log("✅ Sourcify CLI is installed");

  // Check if contracts are compiled
  const artifactsPath = path.join(process.cwd(), "artifacts", "contracts");
  if (!fs.existsSync(artifactsPath)) {
    console.error("❌ Contracts not compiled. Please run: pnpm compile");
    process.exit(1);
  }
  console.log("✅ Contracts are compiled");

  // Check source files exist
  console.log("\n2️⃣ Checking source files...");
  for (const config of contractsToVerify) {
    for (const sourceFile of config.sourceFiles) {
      const filePath = path.join(process.cwd(), sourceFile);
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Source file not found: ${sourceFile}`);
        process.exit(1);
      }
    }
  }
  console.log("✅ All source files found");

  // Generate metadata
  console.log("\n3️⃣ Generating verification metadata...");
  generateVerificationMetadata();

  // Verify contracts
  console.log("\n4️⃣ Verifying contracts...");
  console.log("=" .repeat(60));

  for (const config of contractsToVerify) {
    try {
      verifyContract(config);
    } catch (error) {
      console.error(`\n❌ Verification failed for ${config.name}`);
      console.error("Please check the error above and try again.");
      console.error("\nAlternative: Use the Sourcify web UI at https://sourcify.dev");
      process.exit(1);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ Verification Complete!");
  console.log("\n📋 Verification Summary:");
  for (const config of contractsToVerify) {
    console.log(`   ✅ ${config.name}: ${config.address}`);
    console.log(
      `      View: https://sourcify.dev/#/lookup/${config.address}`
    );
    console.log(
      `      Explorer: https://celoscan.io/address/${config.address}`
    );
  }

  console.log("\n📝 Next Steps:");
  console.log("   1. Check verification status on Sourcify");
  console.log("   2. Verify proxy contract (if needed)");
  console.log("   3. Update documentation with verification links");
}

// Run verification
main()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Verification script failed:", error);
    process.exit(1);
  });

