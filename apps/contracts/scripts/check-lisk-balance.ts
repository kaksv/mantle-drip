#!/usr/bin/env ts-node

/**
 * Check ETH balance on Lisk mainnet for deployer wallet
 * Usage: ts-node scripts/check-lisk-balance.ts
 */

import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
const envPath = path.join(__dirname, "../.env");
dotenv.config({ path: envPath });

// Lisk mainnet RPC
const LISK_RPC_URL = process.env.LISK_RPC_URL || "https://rpc.api.lisk.com";
const LISK_CHAIN_ID = 1135;

async function checkBalance() {
  // Get private key from environment
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in .env file");
    console.error("Please add PRIVATE_KEY=0x... to apps/contracts/.env");
    process.exit(1);
  }

  // Create wallet from private key
  const wallet = new ethers.Wallet(
    privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`
  );
  
  console.log("🔍 Checking ETH balance on Lisk mainnet...");
  console.log("📍 Wallet Address:", wallet.address);
  console.log("🌐 RPC URL:", LISK_RPC_URL);
  console.log("");

  // Create provider
  const provider = new ethers.JsonRpcProvider(LISK_RPC_URL);
  
  try {
    // Get network info
    const network = await provider.getNetwork();
    console.log("📡 Connected to network:", network.name);
    console.log("🔗 Chain ID:", network.chainId.toString());
    console.log("");

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    const balanceInEth = ethers.formatEther(balance);
    
    console.log("💰 Balance:", balanceInEth, "ETH");
    console.log("");

    // Check if balance is sufficient
    const minRequired = ethers.parseEther("0.05"); // 0.05 ETH minimum
    const balanceBigInt = BigInt(balance.toString());
    
    if (balanceBigInt >= minRequired) {
      console.log("✅ Sufficient balance for deployment!");
      console.log("   Estimated deployment cost: ~0.03-0.05 ETH");
    } else if (balanceBigInt > 0n) {
      console.log("⚠️  Low balance - may not be enough for deployment");
      console.log("   Current balance:", balanceInEth, "ETH");
      console.log("   Recommended: at least 0.05 ETH");
    } else {
      console.log("❌ No ETH balance found!");
      console.log("   Please fund your wallet with ETH on Lisk mainnet");
      console.log("   Block Explorer: https://blockscout.lisk.com/address/" + wallet.address);
    }

    console.log("");
    console.log("🔗 View on explorer:");
    console.log(`   https://blockscout.lisk.com/address/${wallet.address}`);

  } catch (error: any) {
    console.error("❌ Error checking balance:");
    console.error(error.message);
    
    if (error.message.includes("network")) {
      console.error("");
      console.error("💡 Tip: Check if the RPC URL is correct:");
      console.error("   LISK_RPC_URL=" + LISK_RPC_URL);
    }
    
    process.exit(1);
  }
}

checkBalance()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
