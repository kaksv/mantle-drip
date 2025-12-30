import { celo } from "wagmi/chains";
import { defineChain } from "viem";

// Chain IDs - Supporting Mainnet, Sepolia testnet, Alfajores testnet, and Lisk mainnet
export const CELO_MAINNET_ID = 42220;
export const CELO_SEPOLIA_ID = 11142220;
export const CELO_ALFAJORES_ID = 44787;
export const LISK_MAINNET_ID = 1135;
export const MANTLE_TESTNET_ID = 5001;
export const MANTLE_MAINNET_ID = 5000;

// Define Celo Sepolia chain
export const celoSepolia = defineChain({
  id: CELO_SEPOLIA_ID,
  name: "Celo Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "CELO",
    symbol: "CELO",
  },
  rpcUrls: {
    default: {
      http: ["https://forno.celo-sepolia.celo-testnet.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Celo Sepolia Explorer",
      url: "https://celo-sepolia.blockscout.com",
    },
  },
  testnet: true,
});

// Define Mantle Testnet chain
export const mantleTestnetChain = defineChain({
  id: MANTLE_TESTNET_ID,
  name: "Mantle Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "MANTLE",
    symbol: "MNT",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.mantle.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Mantle Sepolia Explorer",
      url: "https://sepolia.mantlescan.xyz/",
    },
  },
  testnet: true,
});

// Define Mantle Mainnet
export const mantleMainnet = defineChain({
  id: MANTLE_MAINNET_ID,
  name: "Mantle Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "MANTLE",
    symbol: "MNT",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.mantle.xyz","https://mantle-rpc.publicnode.com","https://mantle.drpc.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Mantle Sepolia Explorer",
      url: "https://mantlescan.xyz/",
    },
  },
  testnet: false,
});

// Define Lisk Mainnet chain
// Note: Native currency on Lisk is ETH (Ethereum), not LSK
// LSK is an ERC20 token with address 0xac485391EB2d7D88253a7F1eF18C37f4242D1A24
export const liskMainnet = defineChain({
  id: LISK_MAINNET_ID,
  name: "Lisk Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.api.lisk.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Lisk Explorer",
      url: "https://blockscout.lisk.com",
    },
  },
  testnet: false,
});

/**
 * Contract addresses by network
 * 
 * Deployed addresses:
 * - Celo Sepolia Testnet (Proxy Deployment):
 *   - DripCore Proxy: 0xfAaB5005f7844eC5499cF258F52dE29EDc74aa31
 *   - DripCore Implementation: 0xe4789E09696De271E9192e88883722C38326D741
 *   - Proxy Admin: 0xb94d80dB6a120D6c22f199c5Ff9B4CF9C8F4EE25
 *   - SubscriptionManager: 0xb8eCfcC00e1d63525b81cF2bC17125f56952D384
 * - Celo Mainnet (Proxy Deployment):
 *   - DripCore Proxy: 0x5530975fDe062FE6706298fF3945E3d1a17A310a
 *   - DripCore Implementation: 0x081cB570E86bc3aA09FE5d848c2d91368fcEf0dE
 *   - Proxy Admin: 0x90FD81efC0bB74cca2997ebB6D77e5145788f481
 *   - SubscriptionManager: 0xBE3e232657233224F14b7b2a5625f69aF8F95054
 * - Lisk Mainnet:
 *   - DripCore Proxy: 0x87BcC4Ef6817d3137568Be91f019bC4e35d9A4b6
 *   - DripCore Implementation: 0x50203ba83FB9Ce709Dd7Ddd4D335aEcdF532F31a
 *   - Proxy Admin: 0x4F6Bee0bAf044F7124fE701ade99F049ef402a88
 *   - SubscriptionManager: 0x009AB24eC563d05cfD3345E6128cBaFAb8b62299
 */
export const CONTRACT_ADDRESSES = {
  [CELO_MAINNET_ID]: {
    DripCore: "0x5530975fDe062FE6706298fF3945E3d1a17A310a" as `0x${string}`,
    SubscriptionManager: "0xBE3e232657233224F14b7b2a5625f69aF8F95054" as `0x${string}`,
  },
  [CELO_SEPOLIA_ID]: {
    DripCore: "0xfAaB5005f7844eC5499cF258F52dE29EDc74aa31" as `0x${string}`,
    SubscriptionManager: "0xb8eCfcC00e1d63525b81cF2bC17125f56952D384" as `0x${string}`,
  },
  [LISK_MAINNET_ID]: {
    DripCore: "0x87BcC4Ef6817d3137568Be91f019bC4e35d9A4b6" as `0x${string}`,
    SubscriptionManager: "0x009AB24eC563d05cfD3345E6128cBaFAb8b62299" as `0x${string}`,
  },
} as const;

/**
 * Get contract address for current network
 */
export function getContractAddress(
  chainId: number,
  contractName: "DripCore" | "SubscriptionManager"
): `0x${string}` | null {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) return null;
  
  const address = addresses[contractName];
  // Check if address is zero (not deployed)
  if (address === "0x0000000000000000000000000000000000000000") return null;
  
  return address;
}

