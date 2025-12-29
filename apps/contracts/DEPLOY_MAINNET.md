# Deploy Contracts to Celo Mainnet

This guide will help you deploy the Drip contracts to Celo Mainnet.

## Prerequisites

1. **Environment Variables**: Create a `.env` file in the `apps/contracts` directory with:

```env
PRIVATE_KEY=your_private_key_here
CELOSCAN_API_KEY=your_celoscan_api_key_here
```

**⚠️ Security Warning**: Never commit your `.env` file to git. The `.env` file is already in `.gitignore`.

2. **Mainnet CELO**: Ensure your deployer wallet has sufficient CELO to cover:
   - Gas fees for deployment (estimated ~0.01-0.05 CELO)
   - Any initial contract setup costs

## Deployment Steps

### 1. Verify Environment Setup

```bash
cd apps/contracts
# Make sure .env file exists and has PRIVATE_KEY set
```

### 2. Compile Contracts

```bash
pnpm compile
```

### 3. Deploy to Celo Mainnet

```bash
pnpm deploy:celo
```

This will:
- Deploy `DripCore` contract
- Deploy `SubscriptionManager` contract (depends on DripCore)
- Save deployment addresses to `ignition/deployments/chain-42220/deployed_addresses.json`

### 4. Verify Deployment

After deployment, you'll see output like:

```
DripCore deployed to: 0x...
SubscriptionManager deployed to: 0x...
```

### 5. Update Frontend Configuration

After deployment, update `apps/web/src/lib/contracts/config.ts` with the deployed addresses:

```typescript
export const CONTRACT_ADDRESSES = {
  [CELO_MAINNET_ID]: {
    DripCore: "0x<DEPLOYED_ADDRESS>" as `0x${string}`,
    SubscriptionManager: "0x<DEPLOYED_ADDRESS>` as `0x${string}`,
  },
  // ... rest of config
}
```

### 6. Verify Contracts on Celoscan (Optional)

If you set `CELOSCAN_API_KEY`, you can verify the contracts:

```bash
npx hardhat verify --network celo <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGUMENTS>
```

## Platform Fee Recipient

By default, the deployer address will be used as the platform fee recipient. If you want to use a different address, you can pass it as a parameter:

```bash
pnpm deploy:celo --parameters '{"DripModule":{"platformFeeRecipient":"0xYourFeeRecipientAddress"}}'
```

## Post-Deployment Checklist

- [ ] Contracts deployed successfully
- [ ] Frontend config updated with new addresses
- [ ] Contracts verified on Celoscan (optional but recommended)
- [ ] Test contract interactions on mainnet
- [ ] Update documentation with deployed addresses

## Troubleshooting

### Insufficient Funds
If you get an error about insufficient funds, ensure your wallet has enough CELO for gas.

### Network Connection Issues
If deployment fails, check your internet connection and try again. You can also try different RPC endpoints.

### Contract Verification Failed
Make sure your `CELOSCAN_API_KEY` is correct and that the contract source code matches what was deployed.

