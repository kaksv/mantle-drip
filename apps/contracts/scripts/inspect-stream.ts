import { ethers } from "hardhat";
import * as fs from "path";

/**
 * Script to inspect stream details and diagnose balance calculation issues
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Inspecting with account:", deployer.address);

  // Get network info
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();
  console.log("Network:", network.name, "Chain ID:", chainId);

  // Get proxy address from deployment file
  const path = require("path");
  const deploymentFile = path.join(__dirname, `../ignition/deployments/chain-${chainId}/proxy-deployment.json`);
  const fs = require("fs");
  
  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment file not found: ${deploymentFile}`);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
  const proxyAddress = deploymentInfo.contracts.DripCore.proxy;
  console.log("DripCore Proxy Address:", proxyAddress);

  // Get contract instance
  const DripCore = await ethers.getContractAt("DripCore", proxyAddress);

  const streamId = 3n;
  const recipientAddress = "0x5EA2b5B5F3F0C0C0C0C0C0C0C0C0C0C0C0C0EF4"; // From the screenshot

  console.log("\n=== Stream Details ===");
  const stream = await DripCore.getStream(streamId);
  console.log("Stream ID:", streamId.toString());
  console.log("Sender:", stream.sender);
  console.log("Status:", stream.status.toString(), "(0=Active, 1=Paused, 2=Completed, 3=Cancelled)");
  console.log("Deposit:", ethers.formatEther(stream.deposit), "G$");
  console.log("Start Time:", new Date(Number(stream.startTime) * 1000).toISOString());
  console.log("End Time:", new Date(Number(stream.endTime) * 1000).toISOString());
  console.log("Current Time:", new Date(Date.now()).toISOString());
  console.log("Recipients:", stream.recipients.length);

  console.log("\n=== Recipient Info ===");
  const recipientInfo = await DripCore.getRecipientInfo(streamId, recipientAddress);
  console.log("Recipient:", recipientInfo.recipient);
  console.log("Rate per second:", ethers.formatEther(recipientInfo.ratePerSecond), "G$/sec");
  console.log("Total Withdrawn:", ethers.formatEther(recipientInfo.totalWithdrawn), "G$");
  console.log("Current Accrued (getRecipientBalance):", ethers.formatEther(recipientInfo.currentAccrued), "G$");
  console.log("Last Withdraw Time:", new Date(Number(recipientInfo.lastWithdrawTime) * 1000).toISOString());

  console.log("\n=== Balance Calculation Debug ===");
  const currentTime = BigInt(Math.floor(Date.now() / 1000));
  const endTime = stream.endTime;
  const startTime = stream.startTime;
  const hasExpired = currentTime > endTime;
  console.log("Has Expired:", hasExpired);
  console.log("Time Since Start:", Number(currentTime - startTime), "seconds");
  console.log("Stream Duration:", Number(endTime - startTime), "seconds");
  console.log("Time Since End:", hasExpired ? Number(currentTime - endTime) : 0, "seconds");

  // Calculate what _calculateTotalDistributed would return
  // This is internal, so we can't call it directly, but we can calculate it
  const allRecipientsInfo = await DripCore.getAllRecipientsInfo(streamId);
  let totalOutflowRate = 0n;
  for (const r of allRecipientsInfo) {
    totalOutflowRate += r.ratePerSecond;
  }
  console.log("Total Outflow Rate:", ethers.formatEther(totalOutflowRate), "G$/sec");

  const effectiveEndTime = currentTime > endTime ? endTime : currentTime;
  const elapsedFromStart = effectiveEndTime > startTime ? effectiveEndTime - startTime : 0n;
  const theoreticalTotalDistributed = totalOutflowRate * elapsedFromStart;
  console.log("Theoretical Total Distributed (rate * time):", ethers.formatEther(theoreticalTotalDistributed), "G$");

  // Calculate actual total withdrawn
  let actualTotalWithdrawn = 0n;
  for (const r of allRecipientsInfo) {
    actualTotalWithdrawn += r.totalWithdrawn;
  }
  console.log("Actual Total Withdrawn:", ethers.formatEther(actualTotalWithdrawn), "G$");

  const remainingDepositTheoretical = stream.deposit > theoreticalTotalDistributed 
    ? stream.deposit - theoreticalTotalDistributed 
    : 0n;
  const remainingDepositActual = stream.deposit > actualTotalWithdrawn
    ? stream.deposit - actualTotalWithdrawn
    : 0n;

  console.log("\n=== Remaining Deposit Calculation ===");
  console.log("Using Theoretical Distribution:", ethers.formatEther(remainingDepositTheoretical), "G$");
  console.log("Using Actual Withdrawals:", ethers.formatEther(remainingDepositActual), "G$");
  console.log("\n⚠️  ISSUE: Contract uses theoretical distribution, which shows 0 remaining!");
  console.log("   But actual withdrawals show", ethers.formatEther(remainingDepositActual), "G$ remaining!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

