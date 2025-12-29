#!/bin/bash

# Manual Sourcify Verification Script for Celo Mainnet
# This script provides the exact commands to verify contracts manually

set -e

CHAIN_ID=42220
COMPILER_VERSION="0.8.20"
OPTIMIZATION=true
OPTIMIZATION_RUNS=200

# Contract addresses
DRIPCORE_IMPL="0x8F4C50979efb901C50e79e11DdC2a45FD1451eE3"
SUBSCRIPTION_MANAGER="0xBE3e232657233224F14b7b2a5625f69aF8F95054"
DRIPCORE_PROXY="0x5530975fDe062FE6706298fF3945E3d1a17A310a"

echo "🚀 Sourcify Verification for Celo Mainnet"
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
echo "  --source-files contracts/DripCore.sol \\"
echo "  --source-files contracts/interfaces/IDrip.sol \\"
echo "  --source-files contracts/utils/TokenHelper.sol \\"
echo "  --source-files contracts/interfaces/IERC20.sol \\"
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
  --source-files contracts/DripCore.sol \
  --source-files contracts/interfaces/IDrip.sol \
  --source-files contracts/utils/TokenHelper.sol \
  --source-files contracts/interfaces/IERC20.sol \
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
echo "  --source-files contracts/SubscriptionManager.sol \\"
echo "  --source-files contracts/interfaces/ISubscription.sol \\"
echo "  --source-files contracts/interfaces/IDrip.sol \\"
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
  --source-files contracts/SubscriptionManager.sol \
  --source-files contracts/interfaces/ISubscription.sol \
  --source-files contracts/interfaces/IDrip.sol \
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
echo "  DripCore Implementation: https://celoscan.io/address/$DRIPCORE_IMPL"
echo "  SubscriptionManager: https://celoscan.io/address/$SUBSCRIPTION_MANAGER"
echo "  DripCore Proxy: https://celoscan.io/address/$DRIPCORE_PROXY"
echo ""

