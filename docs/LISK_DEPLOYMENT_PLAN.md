# Lisk Mainnet Contract Deployment Plan

## Overview
This document outlines the step-by-step plan for deploying DripCore and SubscriptionManager contracts to Lisk mainnet.

## Prerequisites

### 1. Environment Setup
- [ ] Ensure you have Node.js and pnpm installed
- [ ] Navigate to `apps/contracts` directory
- [ ] Install dependencies: `pnpm install`

### 2. Required Environment Variables
Create or update `.env` file in `apps/contracts/`:

```env
# Required: Private key of deployer wallet (must have ETH on Lisk for gas)
PRIVATE_KEY=0xYourPrivateKeyHere

# Optional: Platform fee recipient (defaults to deployer)
PLATFORM_FEE_RECIPIENT=0xYourFeeRecipientAddress

# Optional: Proxy admin address (defaults to deployer, use multisig for production!)
PROXY_ADMIN=0xYourProxyAdminAddress

# Optional: Lisk RPC URL (defaults to public RPC)
LISK_RPC_URL=https://rpc.api.lisk.com
```

**⚠️ Security Warnings:**
- Never commit `.env` file to git
- For production, use a multisig wallet as `PROXY_ADMIN`
- Ensure deployer wallet has sufficient ETH on Lisk for gas fees

### 3. Wallet Requirements
- [ ] Deployer wallet must have ETH on Lisk mainnet (not LSK token)
- [ ] Recommended: At least 0.1 ETH for deployment and verification
- [ ] Verify balance on Lisk explorer: https://blockscout.lisk.com

## Implementation Steps

### Step 1: Update Hardhat Configuration

#### 1.1 Add Lisk Network to `hardhat.config.ts`
- [ ] Add Lisk mainnet network configuration:
  ```typescript
  lisk: {
    url: process.env.LISK_RPC_URL || "https://rpc.api.lisk.com",
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    chainId: 1135,
  }
  ```

#### 1.2 Add Lisk to Etherscan Configuration (Optional)
- [ ] Check if Lisk block explorer supports contract verification
- [ ] If supported, add Lisk to `etherscan.customChains`:
  ```typescript
  {
    network: "lisk",
    chainId: 1135,
    urls: {
      apiURL: "https://api.blockscout.lisk.com/api", // Verify actual API URL
      browserURL: "https://blockscout.lisk.com",
    },
  }
  ```
- [ ] Add API key if required (check Lisk documentation)

### Step 2: Update Deployment Scripts

#### 2.1 Update `package.json` Scripts
- [ ] Add Lisk deployment scripts:
  ```json
  "deploy:lisk": "hardhat ignition deploy ignition/modules/Drip.ts --network lisk",
  "deploy:proxy:lisk": "hardhat run scripts/deploy-proxy.ts --network lisk",
  "deploy:proxy:lisk:mainnet": "hardhat run scripts/deploy-proxy.ts --network lisk && node update-frontend-config.js 1135"
  ```

#### 2.2 Update `update-frontend-config.js`
- [ ] Add Lisk chain ID mapping:
  ```javascript
  const deploymentFolders = {
    '42220': 'chain-42220', // Celo Mainnet
    '11142220': 'chain-11142220', // Celo Sepolia
    '44787': 'chain-44787', // Celo Alfajores
    '1135': 'chain-1135', // Lisk Mainnet
  };
  ```
- [ ] Add Lisk chain ID constant mapping:
  ```javascript
  if (chainId === '1135') {
    chainIdConstant = 'LISK_MAINNET_ID';
  }
  ```

### Step 3: Compile Contracts

- [ ] Run compilation to ensure contracts are ready:
  ```bash
  cd apps/contracts
  pnpm compile
  ```
- [ ] Verify no compilation errors
- [ ] Check that all contracts compile successfully

### Step 4: Deploy Contracts

#### 4.1 Choose Deployment Method

**Option A: Direct Deployment (Simple)**
- Uses `DripModule` (ignition)
- Deploys contracts directly without proxy
- Simpler but not upgradeable

**Option B: Proxy Deployment (Recommended)**
- Uses `deploy-proxy.ts` script
- Deploys with upgradeable proxy pattern
- Allows future upgrades
- **Recommended for production**

#### 4.2 Deploy Using Proxy (Recommended)

```bash
cd apps/contracts
pnpm deploy:proxy:lisk
```

This will:
1. Deploy DripCore implementation
2. Deploy TransparentUpgradeableProxy
3. Deploy ProxyAdmin
4. Deploy SubscriptionManager
5. Save deployment info to `ignition/deployments/chain-1135/proxy-deployment.json`

#### 4.3 Expected Output

```
Network: Lisk Mainnet Chain ID: 1135
Deploying contracts with account: 0x...
Account balance: <balance> ETH

=== Deployment Parameters ===
Platform Fee Recipient: 0x...
Proxy Admin: 0x...
============================

Deploying DripCore implementation...
✅ DripCore Proxy deployed to: 0x...
   Implementation address: 0x...
   Proxy Admin address: 0x...

Deploying SubscriptionManager...
✅ SubscriptionManager deployed to: 0x...

✅ Deployment info saved to: ignition/deployments/chain-1135/proxy-deployment.json

=== Deployment Summary ===
DripCore Proxy: 0x...
DripCore Implementation: 0x...
Proxy Admin: 0x...
SubscriptionManager: 0x...
========================
```

### Step 5: Update Frontend Configuration

#### 5.1 Automatic Update (Recommended)
```bash
node update-frontend-config.js 1135
```

This will automatically update `apps/web/src/lib/contracts/config.ts` with deployed addresses.

#### 5.2 Manual Update (If automatic fails)
Update `apps/web/src/lib/contracts/config.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  // ... existing networks
  [LISK_MAINNET_ID]: {
    DripCore: "0x<DEPLOYED_PROXY_ADDRESS>" as `0x${string}`, // Use PROXY address!
    SubscriptionManager: "0x<DEPLOYED_SUBSCRIPTION_MANAGER_ADDRESS>` as `0x${string}`,
  },
} as const;
```

**⚠️ Important**: Always use the **proxy address** for DripCore, not the implementation address!

### Step 6: Verify Contracts (Optional but Recommended)

#### 6.1 Check Block Explorer
- [ ] Visit https://blockscout.lisk.com
- [ ] Search for deployed contract addresses
- [ ] Verify contracts are visible on explorer

#### 6.2 Contract Verification
If Lisk block explorer supports verification:

```bash
# Verify DripCore implementation
npx hardhat verify --network lisk <IMPLEMENTATION_ADDRESS> <PLATFORM_FEE_RECIPIENT> <PROXY_ADMIN>

# Verify SubscriptionManager
npx hardhat verify --network lisk <SUBSCRIPTION_MANAGER_ADDRESS> <DRIPCORE_PROXY_ADDRESS> <PLATFORM_FEE_RECIPIENT>
```

**Note**: Check Lisk documentation for exact verification process and requirements.

### Step 7: Test Deployment

#### 7.1 Basic Functionality Test
- [ ] Connect wallet to Lisk mainnet
- [ ] Verify contracts are accessible
- [ ] Test creating a stream (small amount)
- [ ] Test creating a subscription (small amount)
- [ ] Verify transactions appear on block explorer

#### 7.2 Integration Test
- [ ] Test token approvals work correctly
- [ ] Test native ETH transfers
- [ ] Test ERC20 token transfers (LSK, USDC, USDT)
- [ ] Verify platform fees are collected correctly

## Files to Modify

### 1. `apps/contracts/hardhat.config.ts`
- Add Lisk network configuration
- Add Lisk to etherscan config (if supported)

### 2. `apps/contracts/package.json`
- Add Lisk deployment scripts

### 3. `apps/contracts/update-frontend-config.js`
- Add Lisk chain ID mapping
- Add Lisk chain ID constant

### 4. `apps/web/src/lib/contracts/config.ts`
- Update `CONTRACT_ADDRESSES` with deployed addresses (via script or manual)

## Deployment Checklist

Before deployment:
- [ ] Environment variables configured
- [ ] Deployer wallet has sufficient ETH on Lisk
- [ ] Contracts compiled successfully
- [ ] Hardhat config updated with Lisk network
- [ ] Deployment scripts updated

During deployment:
- [ ] Run deployment command
- [ ] Save deployment addresses
- [ ] Verify deployment success
- [ ] Check transaction on block explorer

After deployment:
- [ ] Update frontend config with addresses
- [ ] Verify contracts on block explorer (if possible)
- [ ] Test basic functionality
- [ ] Document deployment addresses
- [ ] Update deployment documentation

## Post-Deployment

### 1. Document Deployment
- [ ] Record deployment addresses
- [ ] Record deployment transaction hashes
- [ ] Record block numbers
- [ ] Save deployment info file

### 2. Security Considerations
- [ ] Transfer ProxyAdmin ownership to multisig (if applicable)
- [ ] Verify platform fee recipient is correct
- [ ] Document who has access to upgrade contracts
- [ ] Set up monitoring for contract events

### 3. Testing
- [ ] Test all contract functions on Lisk
- [ ] Verify token interactions work
- [ ] Test edge cases
- [ ] Monitor for any issues

## Troubleshooting

### "Insufficient funds for gas"
- Ensure deployer wallet has ETH (not LSK) on Lisk
- Check balance on https://blockscout.lisk.com

### "Network not found"
- Verify Lisk network is added to `hardhat.config.ts`
- Check RPC URL is correct

### "Contract verification failed"
- Check if Lisk block explorer supports verification
- Verify constructor parameters match
- Check API key if required

### "Proxy initialization failed"
- Verify initialization parameters
- Check that proxy hasn't been initialized before
- Review proxy deployment logs

## Important Notes

### Gas Fees
- Lisk uses ETH for gas fees (not LSK)
- Gas prices may vary, monitor network conditions
- Keep extra ETH for verification and testing

### Proxy Pattern
- Always use proxy address in frontend (not implementation)
- Proxy address never changes, implementation can be upgraded
- ProxyAdmin controls upgrades - secure this address!

### Upgrade Considerations
- Storage layout must remain compatible
- Test upgrades on testnet first
- Document all upgrades

### Network Differences
- Lisk is EVM-compatible, so contracts should work as-is
- Native currency is ETH (not LSK)
- Token addresses are different from Celo
- Block explorer is Blockscout (not Celoscan)

## Estimated Costs

- **DripCore Implementation**: ~0.01-0.02 ETH
- **TransparentUpgradeableProxy**: ~0.005-0.01 ETH
- **ProxyAdmin**: ~0.005-0.01 ETH
- **SubscriptionManager**: ~0.01-0.02 ETH
- **Total Estimated**: ~0.03-0.05 ETH

*Costs are estimates and may vary based on network conditions*

## Next Steps After Deployment

1. Update frontend to use deployed addresses
2. Test all functionality on Lisk
3. Monitor contract events
4. Set up alerts for important events
5. Document deployment for team
6. Consider setting up monitoring dashboard

## Support Resources

- Lisk Documentation: https://docs.lisk.com
- Lisk Block Explorer: https://blockscout.lisk.com
- Lisk RPC: https://rpc.api.lisk.com
- Hardhat Documentation: https://hardhat.org/docs
