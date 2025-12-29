#!/usr/bin/env ts-node

/**
 * Estimate gas costs for deploying contracts on Lisk mainnet
 * Usage: ts-node scripts/estimate-lisk-deployment-cost.ts
 */

import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load environment variables
const envPath = path.join(__dirname, "../.env");
dotenv.config({ path: envPath });

// Lisk mainnet RPC
const LISK_RPC_URL = process.env.LISK_RPC_URL || "https://rpc.api.lisk.com";
const LISK_CHAIN_ID = 1135;

async function estimateDeploymentCost() {
  console.log("🔍 Estimating deployment costs on Lisk mainnet...");
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

    // Get current gas price
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || ethers.parseUnits("1", "gwei"); // Fallback if not available
    const maxFeePerGas = feeData.maxFeePerGas || gasPrice;
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.parseUnits("0.1", "gwei");
    
    console.log("⛽ Gas Price Information:");
    console.log("   Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
    if (maxFeePerGas) {
      console.log("   Max Fee Per Gas:", ethers.formatUnits(maxFeePerGas, "gwei"), "gwei");
    }
    if (maxPriorityFeePerGas) {
      console.log("   Max Priority Fee:", ethers.formatUnits(maxPriorityFeePerGas, "gwei"), "gwei");
    }
    console.log("");

    // Get private key for deployment simulation
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.error("❌ PRIVATE_KEY not found in .env file");
      console.error("   Cannot estimate exact costs without deployer address");
      console.error("   Will provide rough estimates based on typical contract sizes");
      console.log("");
    }

    // Connect to Hardhat to get contract factories
    let DripCoreFactory: any;
    let SubscriptionManagerFactory: any;
    let ProxyAdminFactory: any;
    let TransparentUpgradeableProxyFactory: any;

    try {
      // Try to import hardhat
      const hre = await import("hardhat");
      const { ethers: hreEthers } = hre;
      
      DripCoreFactory = await hreEthers.getContractFactory("DripCore");
      SubscriptionManagerFactory = await hreEthers.getContractFactory("SubscriptionManager");
      
      // Try to get OpenZeppelin contracts
      try {
        ProxyAdminFactory = await hreEthers.getContractFactory("ProxyAdmin");
        TransparentUpgradeableProxyFactory = await hreEthers.getContractFactory("TransparentUpgradeableProxy");
      } catch (e) {
        console.log("⚠️  OpenZeppelin contracts not found, will estimate based on typical sizes");
      }
    } catch (error) {
      console.log("⚠️  Could not load contracts, using estimated gas values");
      console.log("");
    }

    // Create wallet if private key available
    let deployer: ethers.Wallet | null = null;
    if (privateKey) {
      deployer = new ethers.Wallet(
        privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`,
        provider
      );
      console.log("📍 Deployer Address:", deployer.address);
      console.log("");
    }

    // Estimate gas for each contract
    const estimates: Array<{ name: string; gas: bigint; cost: string }> = [];

    // 1. DripCore Implementation
    console.log("📦 Estimating DripCore Implementation deployment...");
    let dripCoreGas = 0n;
    if (DripCoreFactory && deployer) {
      try {
        // DripCore has empty constructor (upgradeable), so no constructor args
        const deploymentData = DripCoreFactory.getDeployTransaction({});
        const estimatedGas = await provider.estimateGas({
          data: deploymentData.data,
          from: deployer.address,
        });
        dripCoreGas = estimatedGas;
        console.log("   ✅ Estimated gas:", dripCoreGas.toString());
      } catch (error: any) {
        console.log("   ⚠️  Could not estimate, using default:", error.message);
        dripCoreGas = ethers.parseUnits("3000000", "wei"); // ~3M gas typical for large contracts
      }
    } else {
      dripCoreGas = ethers.parseUnits("3000000", "wei"); // Estimated
      console.log("   📊 Using estimated gas: ~3,000,000");
    }

    // 2. ProxyAdmin
    console.log("📦 Estimating ProxyAdmin deployment...");
    let proxyAdminGas = 0n;
    if (ProxyAdminFactory && deployer) {
      try {
        const deploymentData = ProxyAdminFactory.getDeployTransaction({});
        const estimatedGas = await provider.estimateGas({
          data: deploymentData.data,
          from: deployer.address,
        });
        proxyAdminGas = estimatedGas;
        console.log("   ✅ Estimated gas:", proxyAdminGas.toString());
      } catch (error: any) {
        console.log("   ⚠️  Could not estimate, using default");
        proxyAdminGas = ethers.parseUnits("500000", "wei"); // ~500K gas
      }
    } else {
      proxyAdminGas = ethers.parseUnits("500000", "wei"); // Estimated
      console.log("   📊 Using estimated gas: ~500,000");
    }

    // 3. TransparentUpgradeableProxy
    console.log("📦 Estimating TransparentUpgradeableProxy deployment...");
    let proxyGas = 0n;
    if (TransparentUpgradeableProxyFactory && deployer) {
      try {
        // We need implementation address, but we'll use a placeholder
        const implementationAddress = "0x0000000000000000000000000000000000000001"; // Placeholder
        const adminAddress = deployer.address; // Placeholder
        const initData = "0x"; // Empty init data for estimation
        
        const deploymentData = TransparentUpgradeableProxyFactory.getDeployTransaction(
          implementationAddress,
          adminAddress,
          initData,
          {}
        );
        const estimatedGas = await provider.estimateGas({
          data: deploymentData.data,
          from: deployer.address,
        });
        proxyGas = estimatedGas;
        console.log("   ✅ Estimated gas:", proxyGas.toString());
      } catch (error: any) {
        console.log("   ⚠️  Could not estimate, using default");
        proxyGas = ethers.parseUnits("800000", "wei"); // ~800K gas
      }
    } else {
      proxyGas = ethers.parseUnits("800000", "wei"); // Estimated
      console.log("   📊 Using estimated gas: ~800,000");
    }

    // 4. SubscriptionManager
    console.log("📦 Estimating SubscriptionManager deployment...");
    let subscriptionManagerGas = 0n;
    if (SubscriptionManagerFactory && deployer) {
      try {
        const dripCoreAddress = "0x0000000000000000000000000000000000000001"; // Placeholder
        const platformFeeRecipient = deployer.address;
        const deploymentData = SubscriptionManagerFactory.getDeployTransaction(
          dripCoreAddress,
          platformFeeRecipient,
          {}
        );
        const estimatedGas = await provider.estimateGas({
          data: deploymentData.data,
          from: deployer.address,
        });
        subscriptionManagerGas = estimatedGas;
        console.log("   ✅ Estimated gas:", subscriptionManagerGas.toString());
      } catch (error: any) {
        console.log("   ⚠️  Could not estimate, using default");
        subscriptionManagerGas = ethers.parseUnits("2000000", "wei"); // ~2M gas
      }
    } else {
      subscriptionManagerGas = ethers.parseUnits("2000000", "wei"); // Estimated
      console.log("   📊 Using estimated gas: ~2,000,000");
    }

    console.log("");
    console.log("=".repeat(60));
    console.log("💰 DEPLOYMENT COST ESTIMATE");
    console.log("=".repeat(60));
    console.log("");

    // Calculate costs
    const useMaxFee = maxFeePerGas && maxFeePerGas > gasPrice;
    const effectiveGasPrice = useMaxFee ? maxFeePerGas : gasPrice;

    const contracts = [
      { name: "DripCore Implementation", gas: dripCoreGas },
      { name: "ProxyAdmin", gas: proxyAdminGas },
      { name: "TransparentUpgradeableProxy", gas: proxyGas },
      { name: "SubscriptionManager", gas: subscriptionManagerGas },
    ];

    let totalGas = 0n;
    let totalCost = 0n;

    contracts.forEach((contract) => {
      const cost = contract.gas * effectiveGasPrice;
      totalGas += contract.gas;
      totalCost += cost;
      
      const costInEth = ethers.formatEther(cost);
      const gasInK = Number(contract.gas) / 1000;
      
      console.log(`📦 ${contract.name}:`);
      console.log(`   Gas: ${gasInK.toFixed(0)}K (${contract.gas.toString()})`);
      console.log(`   Cost: ${costInEth} ETH`);
      console.log("");
    });

    const totalGasInK = Number(totalGas) / 1000;
    const totalCostInEth = ethers.formatEther(totalCost);
    
    console.log("=".repeat(60));
    console.log("📊 TOTAL ESTIMATE:");
    console.log(`   Total Gas: ${totalGasInK.toFixed(0)}K (${totalGas.toString()})`);
    console.log(`   Total Cost: ${totalCostInEth} ETH`);
    console.log("=".repeat(60));
    console.log("");

    // Add buffer for safety
    const buffer = totalCost * 120n / 100n; // 20% buffer
    const bufferInEth = ethers.formatEther(buffer);
    
    console.log("💡 RECOMMENDED:");
    console.log(`   Minimum: ${totalCostInEth} ETH`);
    console.log(`   With 20% buffer: ${bufferInEth} ETH`);
    console.log(`   Safe amount: ${(parseFloat(bufferInEth) + 0.01).toFixed(6)} ETH`);
    console.log("");

    // Check current balance if deployer available
    if (deployer) {
      const balance = await provider.getBalance(deployer.address);
      const balanceInEth = ethers.formatEther(balance);
      
      console.log("💼 CURRENT BALANCE:");
      console.log(`   ${balanceInEth} ETH`);
      console.log("");
      
      if (balance >= buffer) {
        console.log("✅ Sufficient balance for deployment!");
      } else if (balance >= totalCost) {
        console.log("⚠️  Balance is sufficient but close to minimum");
        console.log("   Consider adding buffer for safety");
      } else {
        const needed = buffer - balance;
        const neededInEth = ethers.formatEther(needed);
        console.log("❌ Insufficient balance");
        console.log(`   Need additional: ${neededInEth} ETH`);
      }
    }

    console.log("");
    console.log("📝 Note: Actual costs may vary based on:");
    console.log("   - Network congestion");
    console.log("   - Contract bytecode size");
    console.log("   - Gas price fluctuations");
    console.log("   - Additional transactions (verification, etc.)");

  } catch (error: any) {
    console.error("❌ Error estimating costs:");
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

estimateDeploymentCost()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
