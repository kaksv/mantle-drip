# Lisk Mainnet Implementation Plan

## Overview
This document outlines the implementation plan for adding Lisk mainnet network support to the Drip application. Users will be able to switch between Celo networks and Lisk mainnet.

## Lisk Mainnet Network Details
- **Chain ID**: 1135
- **RPC Endpoint**: `https://rpc.api.lisk.com`
- **Block Explorer**: `https://blockscout.lisk.com`
- **Native Currency**: LSK (Lisk)
- **Native Currency Decimals**: 18
- **Network Type**: Mainnet (EVM-compatible)

## Implementation Steps

### Phase 1: Core Network Configuration

#### 1.1 Update Chain Configuration (`apps/web/src/lib/contracts/config.ts`)
- [ ] Add `LISK_MAINNET_ID` constant (1135)
- [ ] Define `liskMainnet` chain using `defineChain` from viem
- [ ] Configure chain properties:
  - Chain ID: 1135
  - Name: "Lisk Mainnet"
  - Native currency: LSK (18 decimals)
  - RPC URLs: `https://rpc.api.lisk.com`
  - Block explorer: `https://blockscout.lisk.com`
- [ ] Add Lisk mainnet to `CONTRACT_ADDRESSES` object
  - **Note**: Contract addresses need to be deployed first or provided
  - Placeholder: `0x0000000000000000000000000000000000000000` until deployment

#### 1.2 Update Wallet Provider (`apps/web/src/components/wallet-provider.tsx`)
- [ ] Import `liskMainnet` from config
- [ ] Add `liskMainnet` to `wagmiConfig.chains` array
- [ ] Add transport configuration for Lisk:
  ```typescript
  [liskMainnet.id]: http(),
  ```

#### 1.3 Update Wallet Button (`apps/web/src/components/wallet-button.tsx`)
- [ ] Import `liskMainnet` from config
- [ ] Add Lisk Mainnet to `CHAINS` array:
  ```typescript
  { id: liskMainnet.id, name: "Lisk Mainnet" }
  ```
- [ ] Update balance display to handle LSK instead of CELO when on Lisk network
  - Check `chainId` and display appropriate native currency symbol

### Phase 2: Token Configuration

#### 2.1 Update Token Config (`apps/web/src/lib/tokens/config.ts`)
- [ ] Import `LISK_MAINNET_ID` from contracts config
- [ ] Add `TOKENS_BY_NETWORK[LISK_MAINNET_ID]` entry
- [ ] Configure tokens available on Lisk:
  - Native LSK: `0x0000000000000000000000000000000000000000`
  - **Note**: Research and add Lisk mainnet token addresses for:
    - USDC (if available)
    - USDT (if available)
    - Other stablecoins available on Lisk
  - **Important**: Token addresses must be verified from official Lisk documentation

#### 2.2 Update Token Selector Component
- [ ] Ensure token selector works with Lisk network
- [ ] Test token dropdown shows correct tokens for Lisk

### Phase 3: Contract Deployment & Configuration

#### 3.1 Hardhat Configuration (`apps/contracts/hardhat.config.ts`)
- [ ] Add Lisk mainnet network configuration:
  ```typescript
  lisk: {
    url: "https://rpc.api.lisk.com",
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    chainId: 1135,
  }
  ```
- [ ] Add Lisk to etherscan configuration (if supported)
- [ ] Add custom chain configuration for block explorer verification

#### 3.2 Contract Deployment
- [ ] Deploy DripCore contract to Lisk mainnet
- [ ] Deploy SubscriptionManager contract to Lisk mainnet
- [ ] Update `CONTRACT_ADDRESSES` in config with deployed addresses
- [ ] Verify contracts on Lisk block explorer (if supported)

#### 3.3 Update Deployment Scripts
- [ ] Add deployment script for Lisk: `deploy:lisk`
- [ ] Update `update-frontend-config.js` to support Lisk chain ID
- [ ] Add Lisk to package.json deployment scripts

### Phase 4: API Routes & Backend

#### 4.1 Leaderboard Sync API (`apps/web/src/app/api/leaderboard/sync/route.ts`)
- [ ] Add "lisk" as a valid network parameter
- [ ] Add Lisk mainnet chain configuration:
  ```typescript
  if (network === "lisk") {
    chainId = LISK_MAINNET_ID;
    rpcUrl = process.env.LISK_RPC_URL ?? "https://rpc.api.lisk.com";
    chain = liskMainnet;
  }
  ```
- [ ] Update state ID logic to include Lisk (use unique ID, e.g., 3)
- [ ] Test leaderboard sync works on Lisk network

### Phase 5: UI Components Updates

#### 5.1 Stream Details View (`apps/web/src/components/stream-details-view.tsx`)
- [ ] Add Lisk block explorer URL mapping:
  ```typescript
  const explorerUrl = chainId === LISK_MAINNET_ID
    ? `https://blockscout.lisk.com/address/${contractAddress}`
    : // ... existing logic
  ```

#### 5.2 Streams Analytics Dashboard (`apps/web/src/components/streams-analytics-dashboard.tsx`)
- [ ] Add Lisk mainnet to explorer URLs mapping:
  ```typescript
  [LISK_MAINNET_ID]: "https://blockscout.lisk.com"
  ```

#### 5.3 Export Data Components
- [ ] Update network mapping in export utilities to include Lisk
- [ ] Ensure CSV exports show "Lisk Mainnet" for chain ID 1135

### Phase 6: GoodDollar Integration (If Applicable)

#### 6.1 GoodDollar Constants (`apps/web/src/lib/gooddollar/constants.ts`)
- [ ] Determine if GoodDollar is available on Lisk
- [ ] If not available, ensure GoodDollar features are disabled on Lisk
- [ ] Update `SUPPORTED_CHAIN_IDS` if GoodDollar supports Lisk
- [ ] Update `isSupportedChain` function accordingly

#### 6.2 GoodDollar Components
- [ ] Ensure GoodDollar components check chain support before rendering
- [ ] Add appropriate messaging if GoodDollar is not available on Lisk

### Phase 7: Environment Variables

#### 7.1 Required Environment Variables
- [ ] Add `LISK_RPC_URL` (optional, defaults to public RPC)
- [ ] Add `LISK_MAINNET_RPC_URL` (optional, for custom RPC)
- [ ] Update `.env.example` with Lisk variables
- [ ] Document environment variables in README

### Phase 8: Testing & Validation

#### 8.1 Network Switching
- [ ] Test switching from Celo networks to Lisk mainnet
- [ ] Test switching from Lisk mainnet to Celo networks
- [ ] Verify wallet connection works on Lisk
- [ ] Test balance display shows LSK correctly

#### 8.2 Contract Interactions
- [ ] Test creating streams on Lisk mainnet
- [ ] Test creating subscriptions on Lisk mainnet
- [ ] Test withdrawals on Lisk mainnet
- [ ] Test all DripCore functions on Lisk

#### 8.3 Token Operations
- [ ] Test token selection on Lisk
- [ ] Test token approvals on Lisk
- [ ] Test native LSK transfers
- [ ] Test ERC20 token transfers (if available)

#### 8.4 UI/UX
- [ ] Verify network switcher shows Lisk Mainnet
- [ ] Verify correct native currency symbol (LSK) is displayed
- [ ] Test all components handle Lisk network correctly
- [ ] Verify block explorer links work correctly

### Phase 9: Documentation

#### 9.1 Update README
- [ ] Add Lisk mainnet to supported networks list
- [ ] Document Lisk deployment process
- [ ] Add Lisk network details to network section

#### 9.2 Create Deployment Guide
- [ ] Create `docs/DEPLOY_LISK.md` with deployment instructions
- [ ] Document contract addresses after deployment
- [ ] Include verification steps

## Files to Modify

### Core Configuration Files
1. `apps/web/src/lib/contracts/config.ts` - Add Lisk chain definition
2. `apps/web/src/components/wallet-provider.tsx` - Add Lisk to wagmi config
3. `apps/web/src/components/wallet-button.tsx` - Add Lisk to network switcher
4. `apps/web/src/lib/tokens/config.ts` - Add Lisk token configuration

### Component Files
5. `apps/web/src/components/stream-details-view.tsx` - Add Lisk explorer URL
6. `apps/web/src/components/streams-analytics-dashboard.tsx` - Add Lisk explorer
7. `apps/web/src/components/user-balance.tsx` - Handle LSK display
8. `apps/web/src/components/token-balances.tsx` - Support Lisk tokens
9. `apps/web/src/components/token-selector.tsx` - Support Lisk tokens

### API & Backend Files
10. `apps/web/src/app/api/leaderboard/sync/route.ts` - Add Lisk network support

### Contract Files
11. `apps/contracts/hardhat.config.ts` - Add Lisk network config
12. `apps/contracts/update-frontend-config.js` - Support Lisk chain ID

### Utility Files
13. `apps/web/src/lib/utils/stream-export.ts` - Add Lisk to network mapping
14. `apps/web/src/lib/utils/stream-analytics.ts` - Support Lisk tokens

### GoodDollar Files (if applicable)
15. `apps/web/src/lib/gooddollar/constants.ts` - Update supported chains
16. `apps/web/src/lib/gooddollar/utils.ts` - Update chain checks

## Important Considerations

### 1. Contract Deployment
- **Critical**: Contracts must be deployed to Lisk mainnet before users can use the app
- Deploy DripCore and SubscriptionManager contracts
- Update contract addresses in config after deployment
- Consider using proxy pattern for upgradeability

### 2. Token Availability
- Research which tokens are available on Lisk mainnet
- Verify token addresses from official sources
- Some tokens (like cUSD) are Celo-specific and won't be available on Lisk
- Focus on cross-chain tokens like USDC, USDT if available

### 3. Gas Fees
- Lisk uses LSK for gas fees (not CELO)
- Update all gas-related messaging to use LSK
- Test gas estimation works correctly

### 4. Network Compatibility
- Lisk is EVM-compatible, so existing contracts should work
- Test all contract interactions thoroughly
- Verify ABI compatibility

### 5. User Experience
- Make network switching seamless
- Provide clear feedback when switching networks
- Handle cases where contracts aren't deployed yet
- Show appropriate error messages for unsupported features

### 6. Testing Strategy
- Test on Lisk mainnet with small amounts first
- Verify all core functionality works
- Test edge cases and error handling
- Ensure proper network detection

## Deployment Checklist

Before marking Lisk mainnet as production-ready:

- [ ] Contracts deployed to Lisk mainnet
- [ ] Contract addresses updated in config
- [ ] Contracts verified on block explorer (if supported)
- [ ] All network switching functionality tested
- [ ] Token configuration verified and tested
- [ ] All contract interactions tested
- [ ] UI components display correctly for Lisk
- [ ] Block explorer links work correctly
- [ ] Error handling tested for edge cases
- [ ] Documentation updated
- [ ] Environment variables documented
- [ ] GoodDollar integration handled (if applicable)

## Estimated Timeline

- **Phase 1-2** (Core Configuration): 2-3 hours
- **Phase 3** (Contract Deployment): 2-4 hours (depending on deployment complexity)
- **Phase 4-5** (API & UI Updates): 2-3 hours
- **Phase 6** (GoodDollar): 1-2 hours (if applicable)
- **Phase 7** (Environment Setup): 30 minutes
- **Phase 8** (Testing): 3-4 hours
- **Phase 9** (Documentation): 1 hour

**Total Estimated Time**: 12-18 hours

## Notes

1. **Contract Addresses**: The implementation assumes contracts will be deployed. Update `CONTRACT_ADDRESSES` with actual deployed addresses.

2. **Token Research**: Research Lisk mainnet token ecosystem to identify available tokens. Some tokens may need to be bridged or may not exist on Lisk.

3. **GoodDollar**: GoodDollar is Celo-specific. Ensure GoodDollar features are properly disabled or show appropriate messaging on Lisk.

4. **Testing**: Thoroughly test all functionality on Lisk mainnet before production release. Consider using a testnet first if available.

5. **User Communication**: Consider adding a banner or notification when users switch to Lisk, especially if contracts aren't deployed yet or if certain features aren't available.
