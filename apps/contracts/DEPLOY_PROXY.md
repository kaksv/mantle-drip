# Deploy DripCore with Upgradeable Proxy

This guide explains how to deploy DripCore using an upgradeable proxy pattern, allowing you to upgrade the contract in the future while maintaining the same address.

## Prerequisites

1. **Install Dependencies**: First, install the required packages:
   ```bash
   cd apps/contracts
   pnpm install
   ```

2. **Environment Variables**: Create a `.env` file with:
   ```env
   PRIVATE_KEY=your_private_key_here
   CELOSCAN_API_KEY=your_celoscan_api_key_here
   PLATFORM_FEE_RECIPIENT=0xYourFeeRecipientAddress  # Optional, defaults to deployer
   PROXY_ADMIN=0xYourProxyAdminAddress  # Optional, defaults to deployer (use multisig for production!)
   ```

   **⚠️ Security Warning**: 
   - Never commit your `.env` file to git
   - For production, use a multisig wallet as `PROXY_ADMIN` for better security

3. **Network CELO**: Ensure your deployer wallet has sufficient CELO for gas fees

## Deployment Steps

### 1. Compile Contracts

```bash
pnpm compile
```

### 2. Deploy Proxy (Recommended Method)

Deploy using the proxy deployment script:

**For Celo Mainnet:**
```bash
pnpm deploy:proxy:celo
```

**For Celo Alfajores Testnet:**
```bash
pnpm deploy:proxy:alfajores
```

**For Celo Sepolia Testnet:**
```bash
pnpm deploy:proxy:sepolia
```

**For Local Development:**
```bash
pnpm deploy:proxy
```

### 3. What Gets Deployed

The deployment script will deploy:

1. **DripCore Implementation**: The actual contract logic (can be upgraded)
2. **TransparentUpgradeableProxy**: The proxy contract (address never changes)
3. **ProxyAdmin**: Manages the proxy upgrades
4. **SubscriptionManager**: Uses the proxy address

### 4. Deployment Output

After deployment, you'll see:

```
✅ DripCore Proxy deployed to: 0x... (This is the address users interact with)
   Implementation address: 0x... (The actual contract logic)
   Proxy Admin address: 0x... (Controls upgrades)

✅ SubscriptionManager deployed to: 0x...

✅ Deployment info saved to: ignition/deployments/chain-{chainId}/proxy-deployment.json
```

### 5. Update Frontend Configuration

Update `apps/web/src/lib/contracts/config.ts` with the **proxy address** (not the implementation):

```typescript
export const CONTRACT_ADDRESSES = {
  [CELO_MAINNET_ID]: {
    DripCore: "0x<PROXY_ADDRESS>" as `0x${string}`,  // Use PROXY address!
    SubscriptionManager: "0x<SUBSCRIPTION_MANAGER_ADDRESS>` as `0x${string}`,
  },
  // ... rest of config
}
```

**Important**: Always use the **proxy address** in your frontend, not the implementation address!

## Upgrading the Contract

When you need to upgrade DripCore (e.g., after adding new features):

### 1. Update the Contract Code

Make your changes to `DripCore.sol`

### 2. Compile

```bash
pnpm compile
```

### 3. Run Upgrade Script

**For Celo Mainnet:**
```bash
PROXY_ADDRESS=0xYourProxyAddress pnpm upgrade
```

Or the script will automatically find the proxy address from the deployment file.

**For specific network:**
```bash
PROXY_ADDRESS=0xYourProxyAddress hardhat run scripts/upgrade-proxy.ts --network celo
```

### 4. Verify Upgrade

The upgrade script will output:
- Proxy address (unchanged)
- New implementation address (changed)

All existing streams and data remain intact!

## Important Notes

### Storage Layout

⚠️ **Critical**: When upgrading, you **cannot**:
- Remove existing state variables
- Change the order of state variables
- Change the type of state variables

You can only:
- Add new state variables at the end
- Add new functions
- Modify function logic (not storage)

### Proxy Admin Security

The `PROXY_ADMIN` address has the power to upgrade the contract. For production:

1. **Use a Multisig Wallet**: Don't use a single EOA
2. **Transfer Ownership**: After deployment, consider transferring ProxyAdmin ownership to a multisig
3. **Document Access**: Keep track of who has access to upgrade

### Testing Upgrades

Before upgrading on mainnet:

1. Test on a local network first
2. Test on testnet (Alfajores/Sepolia)
3. Verify all existing functionality still works
4. Test new features thoroughly

## Architecture

```
Users → TransparentUpgradeableProxy (0xABC... - never changes)
              ↓ delegates to
        DripCore Implementation (0xDEF... - can be upgraded)
              ↓ managed by
        ProxyAdmin (controls upgrades)
```

## Troubleshooting

### "Invalid import: library not installed"

Run `pnpm install` to install dependencies.

### "Proxy is already initialized"

The proxy can only be initialized once. If you need to redeploy, use a new proxy or upgrade the existing one.

### "Storage layout incompatible"

You've changed the storage layout. Review OpenZeppelin's upgradeable contracts guide for proper upgrade patterns.

## Additional Resources

- [OpenZeppelin Upgradeable Contracts](https://docs.openzeppelin.com/upgrades-plugins/1.x/)
- [Proxy Patterns](https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies)
- [Storage Layout](https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable-contracts)

