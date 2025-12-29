import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { getContractAddress } from "@nomicfoundation/hardhat-ignition-ethers/dist/src/utils/contract-address";

/**
 * @title Drip Proxy Deployment Module
 * @notice Deployment configuration for Drip contracts with upgradeable proxy
 * @dev This module handles deployment of DripCore with TransparentUpgradeableProxy
 */
const DripProxyModule = buildModule("DripProxyModule", (m) => {
  // Get the deployer address - will be set during deployment
  const deployer = m.getAccount(0);
  
  // Platform fee recipient (use deployer address)
  const platformFeeRecipient = m.getParameter(
    "platformFeeRecipient",
    deployer // Use deployer as default platform fee recipient
  );

  // Owner for the proxy admin (use deployer address, can be changed to multisig later)
  const proxyAdmin = m.getParameter(
    "proxyAdmin",
    deployer // Use deployer as default proxy admin
  );

  // Step 1: Deploy the implementation contract (DripCore)
  const dripCoreImplementation = m.contract("DripCore", [], {
    id: "DripCoreImplementation",
  });

  // Step 2: Deploy ProxyAdmin contract (manages the proxy)
  const proxyAdminContract = m.contract("ProxyAdmin", [], {
    id: "ProxyAdmin",
    from: proxyAdmin,
  });

  // Step 3: Initialize the implementation (required for upgradeable contracts)
  // We'll call initialize after proxy deployment
  
  // Step 4: Deploy TransparentUpgradeableProxy
  // The proxy will point to the implementation and use ProxyAdmin
  const initializeData = m.encodeFunctionCall(
    dripCoreImplementation,
    "initialize",
    [platformFeeRecipient, proxyAdmin]
  );

  const dripCoreProxy = m.contract(
    "TransparentUpgradeableProxy",
    [
      dripCoreImplementation, // implementation address
      proxyAdminContract, // admin address (ProxyAdmin)
      initializeData, // initialization data
    ],
    {
      id: "DripCoreProxy",
    }
  );

  // Deploy SubscriptionManager contract (depends on DripCore proxy address)
  // Note: SubscriptionManager will use the proxy address, not the implementation
  const subscriptionManager = m.contract(
    "SubscriptionManager",
    [dripCoreProxy, platformFeeRecipient],
    {
      id: "SubscriptionManager",
    }
  );

  return { 
    dripCoreImplementation,
    dripCoreProxy,
    proxyAdmin: proxyAdminContract,
    subscriptionManager 
  };
});

export default DripProxyModule;

