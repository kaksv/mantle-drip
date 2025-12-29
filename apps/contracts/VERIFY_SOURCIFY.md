# Sourcify Verification Plan for Celo Mainnet

This document outlines the step-by-step plan to verify all deployed contracts on Sourcify for Celo Mainnet.

## 🎯 Quick Start (TL;DR)

**Recommended Method**: Use the Sourcify Web UI (easiest):
1. Go to https://sourcify.dev
2. Select "Celo" network (Chain ID: 42220)
3. Upload source files and metadata
4. Follow Method 2 below for detailed steps

**Alternative Method**: Use Hardhat Sourcify Plugin:
```bash
cd apps/contracts
pnpm add --save-dev @xtools-at/hardhat-sourcify
# Then follow Method 3 below
```

**Note**: There is no standalone `@sourcify/cli` package. Use the web UI or Hardhat plugin instead.

## 📋 Overview

**Network**: Celo Mainnet (Chain ID: 42220)  
**Deployed Contracts**:
- **DripCore Proxy**: `0x5530975fDe062FE6706298fF3945E3d1a17A310a`
- **DripCore Implementation**: `0x8F4C50979efb901C50e79e11DdC2a45FD1451eE3`
- **ProxyAdmin**: `0x90FD81efC0bB74cca2997ebB6D77e5145788f481`
- **SubscriptionManager**: `0xBE3e232657233224F14b7b2a5625f69aF8F95054`

## 🎯 Verification Strategy

### Option 1: Sourcify CLI (Recommended)
Automated verification using the official Sourcify CLI tool.

### Option 2: Sourcify Web UI
Manual verification through the Sourcify web interface.

### Option 3: Hardhat Sourcify Plugin
Using Hardhat's built-in Sourcify verification.

---

## 📦 Prerequisites

1. **Ensure contracts are compiled**:
   ```bash
   cd apps/contracts
   pnpm compile
   ```

2. **Verify build artifacts exist**:
   - `artifacts/contracts/DripCore.sol/DripCore.json`
   - `artifacts/contracts/SubscriptionManager.sol/SubscriptionManager.json`
   - `artifacts/build-info/*.json` (contains metadata)

3. **For Hardhat Plugin method** (optional):
   ```bash
   pnpm add --save-dev @xtools-at/hardhat-sourcify
   ```

---

## 🔧 Method 1: Sourcify Web UI (Recommended - Easiest)

The Sourcify web UI is the simplest method and doesn't require any CLI installation.

### Step 1: Access Sourcify

1. Go to https://sourcify.dev
2. Click "Verify Contract" or navigate to the verification page
3. Select "Celo" network (Chain ID: 42220)

### Step 2: Verify DripCore Implementation

1. **Contract Address**: `0x8F4C50979efb901C50e79e11DdC2a45FD1451eE3`
2. **Upload Files**:
   - `contracts/DripCore.sol`
   - `contracts/interfaces/IDrip.sol`
   - `contracts/utils/TokenHelper.sol`
   - `contracts/interfaces/IERC20.sol`
   - `artifacts/contracts/DripCore.sol/DripCore.json` (metadata file)
3. **Compiler Settings**:
   - Solidity Version: `0.8.20`
   - Optimization: Enabled
   - Optimization Runs: `200`
   - Via IR: `true`
4. **Constructor Arguments**: None (empty - it's an upgradeable contract)
5. Click "Verify"

**Note**: The implementation contract has no constructor arguments (it's upgradeable).

### Step 3: Verify SubscriptionManager

1. **Contract Address**: `0xBE3e232657233224F14b7b2a5625f69aF8F95054`
2. **Upload Files**:
   - `contracts/SubscriptionManager.sol`
   - `contracts/interfaces/ISubscription.sol`
   - `contracts/interfaces/IDrip.sol`
   - `artifacts/contracts/SubscriptionManager.sol/SubscriptionManager.json` (metadata file)
3. **Compiler Settings**: Same as DripCore (0.8.20, optimization enabled, runs: 200, via IR: true)
4. **Constructor Arguments**: 
   - Enter: `["0x5530975fDe062FE6706298fF3945E3d1a17A310a"]`
   - Or ABI-encoded: `0000000000000000000000005530975fde062fe6706298ff3945e3d1a17a310a`
5. Click "Verify"

**Constructor Argument**: DripCore proxy address (`0x5530975fDe062FE6706298fF3945E3d1a17A310a`)

### Step 4: Verify Proxy Contract (Optional)

The proxy contracts (`TransparentUpgradeableProxy` and `ProxyAdmin`) are from OpenZeppelin. You have two options:

#### Option A: Verify via Sourcify UI (Easier)
Since these are standard OpenZeppelin contracts, they're likely already verified. Check:
- https://sourcify.dev/#/lookup/0x5530975fDe062FE6706298fF3945E3d1a17A310a
- https://sourcify.dev/#/lookup/0x90FD81efC0bB74cca2997ebB6D77e5145788f481

#### Option B: Manual Verification
If needed, you can verify using OpenZeppelin's verified contracts as reference.

---

## 🔨 Method 2: Hardhat Sourcify Plugin

This method uses a Hardhat plugin to automate verification.

### Step 1: Install Plugin

```bash
cd apps/contracts
pnpm add --save-dev @xtools-at/hardhat-sourcify
```

### Step 2: Update hardhat.config.ts

Add the plugin import and configuration:

```typescript
import "@xtools-at/hardhat-sourcify";

const config: HardhatUserConfig = {
  // ... existing config
  sourcify: {
    enabled: true,
    apiUrl: "https://sourcify.dev/server",
    browserUrl: "https://sourcify.dev",
  },
};
```

### Step 3: Verify Contracts

```bash
# Verify DripCore Implementation
npx hardhat sourcify --network celo 0x8F4C50979efb901C50e79e11DdC2a45FD1451eE3

# Verify SubscriptionManager (with constructor arg)
npx hardhat sourcify --network celo 0xBE3e232657233224F14b7b2a5625f69aF8F95054 --constructor-args "0x5530975fDe062FE6706298fF3945E3d1a17A310a"
```

### Step 4: Verify Proxy (Optional)

The proxy contract address is `0x5530975fDe062FE6706298fF3945E3d1a17A310a`. Since it's a standard OpenZeppelin proxy, it may already be verified. If not:

1. Use OpenZeppelin's verified `TransparentUpgradeableProxy` as reference
2. Constructor arguments: Implementation address, Admin address, Initialization data

---

## 📚 Method 3: Using Metadata Files (Advanced)

If you have the full metadata files, you can use Sourcify's API directly or upload the metadata JSON files through the web UI.

### Using Metadata Files

1. Find the metadata file in `artifacts/build-info/*.json`
2. Upload the entire metadata JSON to Sourcify web UI
3. Sourcify will automatically extract all source files and compiler settings

---

## 📝 Required Files for Verification

### DripCore Implementation

**Source Files**:
- `contracts/DripCore.sol`
- `contracts/interfaces/IDrip.sol`
- `contracts/utils/TokenHelper.sol`
- `contracts/interfaces/IERC20.sol`

**Metadata**:
- `artifacts/contracts/DripCore.sol/DripCore.json`
- `artifacts/build-info/*.json` (contains full compilation metadata)

**Dependencies** (OpenZeppelin - already verified):
- `@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol`
- `@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol`
- `@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol`

### SubscriptionManager

**Source Files**:
- `contracts/SubscriptionManager.sol`
- `contracts/interfaces/ISubscription.sol`
- `contracts/interfaces/IDrip.sol`

**Metadata**:
- `artifacts/contracts/SubscriptionManager.sol/SubscriptionManager.json`
- `artifacts/build-info/*.json`

**Constructor Arguments**:
- DripCore proxy address: `0x5530975fDe062FE6706298fF3945E3d1a17A310a`

---

## ✅ Verification Checklist

- [ ] DripCore Implementation verified (`0x8F4C50979efb901C50e79e11DdC2a45FD1451eE3`)
- [ ] SubscriptionManager verified (`0xBE3e232657233224F14b7b2a5625f69aF8F95054`)
- [ ] Proxy contract checked (may already be verified)
- [ ] All source files match deployed bytecode
- [ ] Compiler settings match (Solidity 0.8.20, optimization enabled, runs: 200, via IR: true)
- [ ] Constructor arguments correct

---

## 🔍 Verification Status Check

After verification, check status at:

1. **Sourcify Lookup**:
   - https://sourcify.dev/#/lookup/0x8F4C50979efb901C50e79e11DdC2a45FD1451eE3
   - https://sourcify.dev/#/lookup/0xBE3e232657233224F14b7b2a5625f69aF8F95054
   - https://sourcify.dev/#/lookup/0x5530975fDe062FE6706298fF3945E3d1a17A310a

2. **Blockscout** (Celo Explorer):
   - https://celoscan.io/address/0x8F4C50979efb901C50e79e11DdC2a45FD1451eE3
   - https://celoscan.io/address/0xBE3e232657233224F14b7b2a5625f69aF8F95054
   - https://celoscan.io/address/0x5530975fDe062FE6706298fF3945E3d1a17A310a

---

## 🐛 Troubleshooting

### Issue: "Contract not found"
- Ensure the contract address is correct
- Verify the contract was deployed on Celo Mainnet (Chain ID: 42220)

### Issue: "Source code mismatch"
- Ensure compiler settings match exactly (version, optimization, runs, via IR)
- Check that all source files are included
- Verify no modifications were made after deployment

### Issue: "Constructor arguments mismatch"
- For SubscriptionManager, ensure the DripCore proxy address is correct
- Use ABI encoder to verify constructor argument encoding

### Issue: "Metadata not found"
- Recompile contracts: `pnpm compile`
- Ensure `artifacts/build-info/*.json` files exist
- Check that `hardhat.config.ts` has correct compiler settings

---

## 📚 Additional Resources

- **Sourcify Documentation**: https://docs.sourcify.dev
- **Sourcify API**: https://sourcify.dev/server
- **Sourcify CLI**: https://github.com/sourcifyeth/sourcify-cli
- **Celo Explorer**: https://celoscan.io
- **OpenZeppelin Contracts**: https://github.com/OpenZeppelin/openzeppelin-contracts

---

## 🚀 Quick Start (Recommended Method - Web UI)

```bash
# 1. Navigate to contracts directory
cd apps/contracts

# 2. Compile contracts (if not already compiled)
pnpm compile

# 3. Open Sourcify Web UI
# Go to: https://sourcify.dev
# Select "Celo" network (Chain ID: 42220)

# 4. For each contract:
#    - Enter contract address
#    - Upload source files and metadata JSON
#    - Enter compiler settings (0.8.20, optimization: true, runs: 200, via IR: true)
#    - Enter constructor args (if any)
#    - Click "Verify"
```

**Contract Addresses**:
- DripCore Implementation: `0x8F4C50979efb901C50e79e11DdC2a45FD1451eE3` (no constructor args)
- SubscriptionManager: `0xBE3e232657233224F14b7b2a5625f69aF8F95054` (constructor: `["0x5530975fDe062FE6706298fF3945E3d1a17A310a"]`)

---

**Last Updated**: Based on deployment at `2025-11-28T13:42:25.673Z`

