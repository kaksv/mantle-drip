import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

/**
 * @title Drip Test Fixture
 * @notice Fixture for deploying Drip contracts in tests
 * @dev This fixture deploys all necessary contracts for testing
 */
export async function deployDripFixture() {
  // Get ethers from hardhat runtime environment
  // With @nomicfoundation/hardhat-ethers plugin, ethers is available via hre.ethers
  const hre = require("hardhat");
  const ethers = hre.ethers;
  
  const [deployer, sender, recipient1, recipient2, recipient3, platformFeeRecipient, treasury] = 
    await ethers.getSigners();

  // Deploy Mock ERC20 tokens for testing
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockCUSD = await MockERC20.deploy("Celo Dollar", "cUSD", 18);
  await mockCUSD.waitForDeployment();
  const mockUSDC = await MockERC20.deploy("USD Coin", "USDC", 6);
  await mockUSDC.waitForDeployment();
  const mockUSDT = await MockERC20.deploy("Tether", "USDT", 6);
  await mockUSDT.waitForDeployment();

  // Deploy DripCore
  const DripCore = await ethers.getContractFactory("DripCore");
  const dripCore = await DripCore.deploy(platformFeeRecipient.address);
  await dripCore.waitForDeployment();

  // Deploy SubscriptionManager
  const SubscriptionManager = await ethers.getContractFactory("SubscriptionManager");
  const subscriptionManager = await SubscriptionManager.deploy(
    await dripCore.getAddress(),
    platformFeeRecipient.address
  );
  await subscriptionManager.waitForDeployment();

  // Mint tokens to sender for testing
  const mintAmount = ethers.parseEther("1000000"); // 1M tokens
  await mockCUSD.mint(sender.address, mintAmount);
  await mockUSDC.mint(sender.address, ethers.parseUnits("1000000", 6));
  await mockUSDT.mint(sender.address, ethers.parseUnits("1000000", 6));

  return {
    deployer,
    sender,
    recipient1,
    recipient2,
    recipient3,
    platformFeeRecipient,
    treasury,
    dripCore,
    subscriptionManager,
    mockCUSD,
    mockUSDC,
    mockUSDT,
  };
}
