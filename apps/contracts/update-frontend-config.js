#!/usr/bin/env node

/**
 * Script to update frontend config with deployed contract addresses
 * Usage: node update-frontend-config.js <chainId>
 * Example: node update-frontend-config.js 42220
 */

const fs = require('fs');
const path = require('path');

const chainId = process.argv[2];
if (!chainId) {
  console.error('Usage: node update-frontend-config.js <chainId>');
  console.error('Example: node update-frontend-config.js 42220 (for mainnet)');
  process.exit(1);
}

// Map chain IDs to deployment folders
const deploymentFolders = {
  '42220': 'chain-42220', // Celo Mainnet
  '11142220': 'chain-11142220', // Celo Sepolia
  '44787': 'chain-44787', // Celo Alfajores
  '1135': 'chain-1135', // Lisk Mainnet
};

const deploymentFolder = deploymentFolders[chainId];
if (!deploymentFolder) {
  console.error(`Unknown chain ID: ${chainId}`);
  process.exit(1);
}

// Path to deployed addresses
const deployedAddressesPath = path.join(
  __dirname,
  'ignition',
  'deployments',
  deploymentFolder,
  'deployed_addresses.json'
);

// Path to frontend config
const frontendConfigPath = path.join(
  __dirname,
  '..',
  'web',
  'src',
  'lib',
  'contracts',
  'config.ts'
);

// Try to read proxy deployment first, fallback to regular deployment
const proxyDeploymentPath = path.join(
  __dirname,
  'ignition',
  'deployments',
  deploymentFolder,
  'proxy-deployment.json'
);

let dripCoreAddress, subscriptionManagerAddress;

if (fs.existsSync(proxyDeploymentPath)) {
  // Use proxy deployment
  const proxyDeployment = JSON.parse(fs.readFileSync(proxyDeploymentPath, 'utf8'));
  dripCoreAddress = proxyDeployment.contracts.DripCore.proxy; // Use proxy address, not implementation
  subscriptionManagerAddress = proxyDeployment.contracts.SubscriptionManager;
  console.log('📦 Using proxy deployment addresses');
} else if (fs.existsSync(deployedAddressesPath)) {
  // Fallback to regular deployment
  const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, 'utf8'));
  dripCoreAddress = deployedAddresses['DripModule#DripCore'] || deployedAddresses['DripProxyModule#DripCoreProxy'];
  subscriptionManagerAddress = deployedAddresses['DripModule#SubscriptionManager'] || deployedAddresses['DripProxyModule#SubscriptionManager'];
  console.log('📦 Using regular deployment addresses');
} else {
  console.error(`Deployment addresses not found at: ${deployedAddressesPath}`);
  console.error('Please deploy contracts first using: pnpm deploy:proxy:celo or pnpm deploy:celo');
  process.exit(1);
}

if (!dripCoreAddress || !subscriptionManagerAddress) {
  console.error('Could not find contract addresses in deployment file');
  console.error('Expected keys: DripCore.proxy (for proxy) or DripModule#DripCore (for regular)');
  process.exit(1);
}

// Read frontend config
const configContent = fs.readFileSync(frontendConfigPath, 'utf8');

// Determine which chain ID constant to use
let chainIdConstant;
if (chainId === '42220') {
  chainIdConstant = 'CELO_MAINNET_ID';
} else if (chainId === '11142220') {
  chainIdConstant = 'CELO_SEPOLIA_ID';
} else if (chainId === '1135') {
  chainIdConstant = 'LISK_MAINNET_ID';
} else {
  console.error(`Unsupported chain ID: ${chainId}`);
  process.exit(1);
}

// Replace contract addresses for the specific chain
const addressPattern = new RegExp(
  `(\\[${chainIdConstant}\\]:\\s*\\{[^}]*DripCore:\\s*")[^"]*(".*?SubscriptionManager:\\s*")[^"]*(".*?\\})`,
  's'
);

const replacement = `$1${dripCoreAddress}$2${subscriptionManagerAddress}$3`;

const updatedConfig = configContent.replace(addressPattern, replacement);

if (updatedConfig === configContent) {
  console.error('Could not find contract address section to update');
  console.error(`Looking for: [${chainIdConstant}]`);
  process.exit(1);
}

// Write updated config
fs.writeFileSync(frontendConfigPath, updatedConfig, 'utf8');

console.log(`✅ Updated frontend config with deployed addresses:`);
console.log(`   DripCore: ${dripCoreAddress}`);
console.log(`   SubscriptionManager: ${subscriptionManagerAddress}`);
console.log(`   Chain ID: ${chainId} (${chainIdConstant})`);

