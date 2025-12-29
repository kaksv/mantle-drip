# Contract Upgrade Instructions

## Changes Made

1. **Removed partial withdrawal support**: The `withdrawFromStream` function now only accepts `streamId` and `recipient` parameters. It always withdraws the full available balance.

2. **Updated frontend**: Removed partial withdrawal UI from withdraw modal. Users can now only withdraw all available balance.

## Upgrade Steps

### 1. Compile Contracts

```bash
cd apps/contracts
pnpm compile
```

### 2. Upgrade on Sepolia Testnet

```bash
# Make sure you have PRIVATE_KEY set in .env
# The script will automatically find the proxy address from deployment files
pnpm upgrade --network sepolia
```

Or explicitly set the proxy address:
```bash
PROXY_ADDRESS=0xYourSepoliaProxyAddress pnpm upgrade --network sepolia
```

### 3. Verify Upgrade on Sepolia

After upgrading, verify the new implementation:
- Check the transaction on CeloScan Sepolia
- Verify the new implementation address
- Test a withdrawal to ensure it works correctly

### 4. Upgrade on Mainnet

**⚠️ IMPORTANT: Only upgrade on mainnet after thorough testing on Sepolia!**

```bash
# Make sure you have PRIVATE_KEY set in .env
# The script will automatically find the proxy address from deployment files
pnpm upgrade --network celo
```

Or explicitly set the proxy address:
```bash
PROXY_ADDRESS=0x5530975fDe062FE6706298fF3945E3d1a17A310a pnpm upgrade --network celo
```

### 5. Verify Upgrade on Mainnet

After upgrading:
- Check the transaction on CeloScan Mainnet
- Verify the new implementation address
- Test a withdrawal to ensure it works correctly

## Important Notes

1. **Storage Layout**: This upgrade does NOT change storage layout, so it's safe.

2. **Breaking Change**: The function signature changed from:
   ```solidity
   function withdrawFromStream(uint256 streamId, address recipient, uint256 amount)
   ```
   to:
   ```solidity
   function withdrawFromStream(uint256 streamId, address recipient)
   ```

3. **Frontend Update**: Make sure the frontend is updated before or immediately after the upgrade, as old frontend code will fail when trying to call the old function signature.

4. **Proxy Address**: The proxy address remains the same. Only the implementation address changes.

## Deployment Addresses

### Mainnet
- Proxy: `0x5530975fDe062FE6706298fF3945E3d1a17A310a`
- Implementation: (will be updated after upgrade)

### Sepolia
- Proxy: (check deployment files)
- Implementation: (will be updated after upgrade)

## Testing Checklist

- [ ] Compile contracts successfully
- [ ] Upgrade on Sepolia testnet
- [ ] Test withdrawal on Sepolia (should withdraw full balance)
- [ ] Verify no partial withdrawal is possible
- [ ] Upgrade on Mainnet
- [ ] Test withdrawal on Mainnet (should withdraw full balance)
- [ ] Verify frontend works correctly with new contract


