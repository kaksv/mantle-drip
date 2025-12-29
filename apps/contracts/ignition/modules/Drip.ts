import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * @title Drip Deployment Module
 * @notice Deployment configuration for Drip contracts
 * @dev This module handles deployment of all Drip-related contracts
 */
const DripModule = buildModule("DripModule", (m) => {
  // Get the deployer address - will be set during deployment
  const deployer = m.getAccount(0);
  
  // Platform fee recipient (use deployer address)
  const platformFeeRecipient = m.getParameter(
    "platformFeeRecipient",
    deployer // Use deployer as default platform fee recipient
  );

  // Deploy DripCore contract
  const dripCore = m.contract("DripCore", [platformFeeRecipient], {
    id: "DripCore",
  });

  // Deploy SubscriptionManager contract (depends on DripCore)
  const subscriptionManager = m.contract(
    "SubscriptionManager",
    [dripCore, platformFeeRecipient],
    {
      id: "SubscriptionManager",
    }
  );

  return { dripCore, subscriptionManager };
});

export default DripModule;

