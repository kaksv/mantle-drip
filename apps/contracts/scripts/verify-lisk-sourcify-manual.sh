#!/bin/bash

# Manual Sourcify Verification Script for Lisk Mainnet
# This script provides the exact commands to verify contracts manually using Sourcify CLI

set -e

CHAIN_ID=1135
COMPILER_VERSION="0.8.20"
OPTIMIZATION=true
OPTIMIZATION_RUNS=200
VIA_IR=true

# Contract addresses
DRIPCORE_IMPL="0x50203ba83FB9Ce709Dd7Ddd4D335aEcdF532F31a"
SUBSCRIPTION_MANAGER="0x009AB24eC563d05cfD3345E6128cBaFAb8b62299"
DRIPCORE_PROXY="0x87BcC4Ef6817d3137568Be91f019bC4e35d9A4b6"

echo "🚀 Sourcify Verification for Lisk Mainnet"
echo "=========================================="
echo ""

# Check if Sourcify CLI is installed
if ! command -v sourcify &> /dev/null; then
    echo "❌ Sourcify CLI not found. Installing..."
    npm install -g @sourcify/cli
fi

echo "✅ Sourcify CLI is installed"
echo ""

# Verify DripCore Implementation
echo "📝 Verifying DripCore Implementation..."
echo "Address: $DRIPCORE_IMPL"
echo ""
echo "Command:"
echo "sourcify verify \\"
echo "  --chain-id $CHAIN_ID \\"
echo "  --contract-name DripCore \\"
echo "  --contract-address $DRIPCORE_IMPL \\"
echo "  --compiler-version $COMPILER_VERSION \\"
echo "  --optimization $OPTIMIZATION \\"
echo "  --optimization-runs $OPTIMIZATION_RUNS \\"
echo "  --via-ir $VIA_IR \\"
echo "  --source-files contracts/DripCore.sol \\"
echo "  --source-files contracts/interfaces/IDrip.sol \\"
echo "  --source-files contracts/utils/TokenHelper.sol \\"
echo "  --source-files contracts/interfaces/IERC20.sol \\"
echo "  --source-files contracts/libraries/DripTypes.sol \\"
echo "  --libraries \"\""
echo ""

read -p "Press Enter to verify DripCore Implementation..."

sourcify verify \
  --chain-id $CHAIN_ID \
  --contract-name DripCore \
  --contract-address $DRIPCORE_IMPL \
  --compiler-version $COMPILER_VERSION \
  --optimization $OPTIMIZATION \
  --optimization-runs $OPTIMIZATION_RUNS \
  --via-ir $VIA_IR \
  --source-files contracts/DripCore.sol \
  --source-files contracts/interfaces/IDrip.sol \
  --source-files contracts/utils/TokenHelper.sol \
  --source-files contracts/interfaces/IERC20.sol \
  --source-files contracts/libraries/DripTypes.sol \
  --libraries ""

echo ""
echo "✅ DripCore Implementation verified!"
echo ""

# Verify SubscriptionManager
echo "📝 Verifying SubscriptionManager..."
echo "Address: $SUBSCRIPTION_MANAGER"
echo "Constructor Arg: $DRIPCORE_PROXY"
echo ""
echo "Command:"
echo "sourcify verify \\"
echo "  --chain-id $CHAIN_ID \\"
echo "  --contract-name SubscriptionManager \\"
echo "  --contract-address $SUBSCRIPTION_MANAGER \\"
echo "  --compiler-version $COMPILER_VERSION \\"
echo "  --optimization $OPTIMIZATION \\"
echo "  --optimization-runs $OPTIMIZATION_RUNS \\"
echo "  --via-ir $VIA_IR \\"
echo "  --source-files contracts/SubscriptionManager.sol \\"
echo "  --source-files contracts/interfaces/ISubscription.sol \\"
echo "  --source-files contracts/interfaces/IDrip.sol \\"
echo "  --source-files contracts/libraries/DripTypes.sol \\"
echo "  --constructor-args \"$DRIPCORE_PROXY\" \\"
echo "  --libraries \"\""
echo ""

read -p "Press Enter to verify SubscriptionManager..."

sourcify verify \
  --chain-id $CHAIN_ID \
  --contract-name SubscriptionManager \
  --contract-address $SUBSCRIPTION_MANAGER \
  --compiler-version $COMPILER_VERSION \
  --optimization $OPTIMIZATION \
  --optimization-runs $OPTIMIZATION_RUNS \
  --via-ir $VIA_IR \
  --source-files contracts/SubscriptionManager.sol \
  --source-files contracts/interfaces/ISubscription.sol \
  --source-files contracts/interfaces/IDrip.sol \
  --source-files contracts/libraries/DripTypes.sol \
  --constructor-args "$DRIPCORE_PROXY" \
  --libraries ""

echo ""
echo "✅ SubscriptionManager verified!"
echo ""

echo "=========================================="
echo "✅ Verification Complete!"
echo ""
echo "📋 Verification Links:"
echo "  DripCore Implementation: https://sourcify.dev/#/lookup/$DRIPCORE_IMPL"
echo "  SubscriptionManager: https://sourcify.dev/#/lookup/$SUBSCRIPTION_MANAGER"
echo "  DripCore Proxy: https://sourcify.dev/#/lookup/$DRIPCORE_PROXY"
echo ""
echo "🔍 Explorer Links:"
echo "  DripCore Implementation: https://blockscout.lisk.com/address/$DRIPCORE_IMPL"
echo "  SubscriptionManager: https://blockscout.lisk.com/address/$SUBSCRIPTION_MANAGER"
echo "  DripCore Proxy: https://blockscout.lisk.com/address/$DRIPCORE_PROXY"
echo ""
