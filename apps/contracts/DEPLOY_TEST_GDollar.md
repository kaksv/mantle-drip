# Deploy Test Good Dollar (G$) Token on Celo Sepolia

This guide explains how to deploy a test Good Dollar token on Celo Sepolia for testing purposes.

## Prerequisites

1. **Environment Setup**: Ensure you have a `.env` file in `apps/contracts` with:
   ```env
   PRIVATE_KEY=your_private_key_here
   ```

2. **Sepolia CELO**: Make sure your wallet has CELO on Celo Sepolia for gas fees.

## Deployment Steps

### 1. Compile Contracts

```bash
cd apps/contracts
pnpm compile
```

### 2. Deploy Test Good Dollar Token

```bash
pnpm deploy:gdollar:sepolia
```

This will deploy a MockERC20 contract configured as Good Dollar (G$) with:
- **Name**: "Good Dollar"
- **Symbol**: "G$"
- **Decimals**: 18

### 3. Copy the Deployed Address

After deployment, you'll see output like:
```
✅ Test Good Dollar (G$) deployed to: 0x...
```

Copy this address.

### 4. Update Frontend Configuration

Update `apps/web/src/lib/tokens/config.ts` and replace the placeholder address for G$ on Sepolia:

```typescript
[CELO_SEPOLIA_ID]: [
  // ... other tokens
  { symbol: "G$", address: "0x<YOUR_DEPLOYED_ADDRESS>", decimals: 18, name: "Good Dollar (Test)" },
],
```

### 5. Mint Test Tokens (Optional)

To mint test G$ tokens to your address:

```bash
# Set the deployed token address
export GDOLLAR_ADDRESS=0x<YOUR_DEPLOYED_ADDRESS>

# Mint 1,000,000 G$ to your deployer address
pnpm mint:gdollar:sepolia

# Or mint to a specific address and amount
export RECIPIENT_ADDRESS=0x<RECIPIENT_ADDRESS>
export AMOUNT=1000000
pnpm mint:gdollar:sepolia
```

## Usage

Once deployed and configured:

1. **Token Selector**: G$ will appear in the token dropdown on Celo Sepolia
2. **Balance Display**: Your G$ balance will show in the wallet balance component
3. **Stream Creation**: You can create streams using G$ tokens
4. **Subscription Creation**: You can create subscriptions using G$ tokens

## Notes

- This is a **test token** for development purposes only
- The token uses MockERC20, which includes a `mint()` function for easy testing
- For production, use the real Good Dollar token on mainnet: `0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A`

