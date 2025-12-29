# Sourcify Verification Plan for Lisk Mainnet

This document outlines the step-by-step plan to verify all deployed contracts on Sourcify for Lisk Mainnet.

## 🎯 Quick Start (TL;DR)

**Recommended Method**: Use the Sourcify Web UI (easiest):
1. Go to https://sourcify.dev
2. Select "Lisk" network (Chain ID: 1135)
3. Upload source files and metadata
4. Follow the detailed steps below

## 📋 Overview

**Network**: Lisk Mainnet (Chain ID: 1135)  
**Deployed Contracts**:
- **DripCore Proxy**: `0x87BcC4Ef6817d3137568Be91f019bC4e35d9A4b6`
- **DripCore Implementation**: `0x50203ba83FB9Ce709Dd7Ddd4D335aEcdF532F31a`
- **ProxyAdmin**: `0x4F6Bee0bAf044F7124fE701ade99F049ef402a88`
- **SubscriptionManager**: `0x009AB24eC563d05cfD3345E6128cBaFAb8b62299`

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

---

## 🔧 Method 1: Sourcify Web UI (Recommended - Easiest)

The Sourcify web UI is the simplest method and doesn't require any CLI installation.

### Step 1: Access Sourcify

1. Go to https://sourcify.dev
2. Click "Verify Contract" or navigate to the verification page
3. Select "Lisk" network (Chain ID: 1135)

### Step 2: Verify DripCore Implementation

1. **Contract Address**: `0x50203ba83FB9Ce709Dd7Ddd4D335aEcdF532F31a`
2. **Upload Files**:
   - `contracts/DripCore.sol`
   - `contracts/interfaces/IDrip.sol`
   - `contracts/utils/TokenHelper.sol`
   - `contracts/interfaces/IERC20.sol`
   - `contracts/libraries/DripTypes.sol`
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

1. **Contract Address**: `0x009AB24eC563d05cfD3345E6128cBaFAb8b62299`
2. **Upload Files**:
   - `contracts/SubscriptionManager.sol`
   - `contracts/interfaces/ISubscription.sol`
   - `contracts/interfaces/IDrip.sol`
   - `contracts/libraries/DripTypes.sol`
   - `artifacts/contracts/SubscriptionManager.sol/SubscriptionManager.json` (metadata file)
3. **Compiler Settings**: Same as DripCore (0.8.20, optimization enabled, runs: 200, via IR: true)
4. **Constructor Arguments**: 
   - Enter: `["0x87BcC4Ef6817d3137568Be91f019bC4e35d9A4b6"]`
   - Or ABI-encoded: `00000000000000000000000087bcc4ef6817d3137568be91f019bc4e35d9a4b6`
5. Click "Verify"

**Constructor Argument**: DripCore proxy address (`0x87BcC4Ef6817d3137568Be91f019bC4e35d9A4b6`)

### Step 4: Verify Proxy Contract (Optional)

The proxy contracts (`TransparentUpgradeableProxy` and `ProxyAdmin`) are from OpenZeppelin. You have two options:

#### Option A: Verify via Sourcify UI (Easier)
Since these are standard OpenZeppelin contracts, they're likely already verified. Check:
- https://sourcify.dev/#/lookup/0x87BcC4Ef6817d3137568Be91f019bC4e35d9A4b6
- https://sourcify.dev/#/lookup/0x4F6Bee0bAf044F7124fE701ade99F049ef402a88

#### Option B: Manual Verification
If needed, you can verify using OpenZeppelin's verified contracts as reference.

---

## 🔨 Method 2: Hardhat Sourcify Plugin

This method uses Hardhat's built-in Sourcify verification.

### Step 1: Verify Contracts

```bash
cd apps/contracts

# Verify DripCore Implementation
npx hardhat sourcify --network lisk 0x50203ba83FB9Ce709Dd7Ddd4D335aEcdF532F31a

# Verify SubscriptionManager (with constructor arg)
npx hardhat sourcify --network lisk 0x009AB24eC563d05cfD3345E6128cBaFAb8b62299 --constructor-args "0x87BcC4Ef6817d3137568Be91f019bC4e35d9A4b6"
```

---

## 📝 Required Files for Verification

### DripCore Implementation

**Source Files**:
- `contracts/DripCore.sol`
- `contracts/interfaces/IDrip.sol`
- `contracts/utils/TokenHelper.sol`
- `contracts/interfaces/IERC20.sol`
- `contracts/libraries/DripTypes.sol`

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
- `contracts/libraries/DripTypes.sol`

**Metadata**:
- `artifacts/contracts/SubscriptionManager.sol/SubscriptionManager.json`
- `artifacts/build-info/*.json`

**Constructor Arguments**:
- DripCore proxy address: `0x87BcC4Ef6817d3137568Be91f019bC4e35d9A4b6`

---

## ✅ Verification Checklist

- [ ] DripCore Implementation verified (`0x50203ba83FB9Ce709Dd7Ddd4D335aEcdF532F31a`)
- [ ] SubscriptionManager verified (`0x009AB24eC563d05cfD3345E6128cBaFAb8b62299`)
- [ ] Proxy contract checked (may already be verified)
- [ ] All source files match deployed bytecode
- [ ] Compiler settings match (Solidity 0.8.20, optimization enabled, runs: 200, via IR: true)
- [ ] Constructor arguments correct

---

## 🔍 Verification Status Check

After verification, check status at:

1. **Sourcify Lookup**:
   - https://sourcify.dev/#/lookup/0x50203ba83FB9Ce709Dd7Ddd4D335aEcdF532F31a
   - https://sourcify.dev/#/lookup/0x009AB24eC563d05cfD3345E6128cBaFAb8b62299
   - https://sourcify.dev/#/lookup/0x87BcC4Ef6817d3137568Be91f019bC4e35d9A4b6

2. **Blockscout** (Lisk Explorer):
   - https://blockscout.lisk.com/address/0x50203ba83FB9Ce709Dd7Ddd4D335aEcdF532F31a
   - https://blockscout.lisk.com/address/0x009AB24eC563d05cfD3345E6128cBaFAb8b62299
   - https://blockscout.lisk.com/address/0x87BcC4Ef6817d3137568Be91f019bC4e35d9A4b6

---

## 🐛 Troubleshooting

### Issue: "Contract not found"
- Ensure the contract address is correct
- Verify the contract was deployed on Lisk Mainnet (Chain ID: 1135)

### Issue: "Source code mismatch"
- Ensure compiler settings match exactly (version, optimization, runs, via IR)
- Check that all source files are included
- Verify no modifications were made after deployment

### Issue: "Constructor arguments mismatch"
- For SubscriptionManager, ensure the DripCore proxy address is correct: `0x87BcC4Ef6817d3137568Be91f019bC4e35d9A4b6`
- Use ABI encoder to verify constructor argument encoding

### Issue: "Metadata not found"
- Recompile contracts: `pnpm compile`
- Ensure `artifacts/build-info/*.json` files exist
- Check that `hardhat.config.ts` has correct compiler settings

---

## 📚 Additional Resources

- **Sourcify Documentation**: https://docs.sourcify.dev
- **Sourcify API**: https://sourcify.dev/server
- **Lisk Explorer**: https://blockscout.lisk.com
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
# Select "Lisk" network (Chain ID: 1135)

# 4. For each contract:
#    - Enter contract address
#    - Upload source files and metadata JSON
#    - Enter compiler settings (0.8.20, optimization: true, runs: 200, via IR: true)
#    - Enter constructor args (if any)
#    - Click "Verify"
```

**Contract Addresses**:
- DripCore Implementation: `0x50203ba83FB9Ce709Dd7Ddd4D335aEcdF532F31a` (no constructor args)
- SubscriptionManager: `0x009AB24eC563d05cfD3345E6128cBaFAb8b62299` (constructor: `["0x87BcC4Ef6817d3137568Be91f019bC4e35d9A4b6"]`)

---

**Last Updated**: Based on deployment at `2025-12-14T15:35:22.850Z`
