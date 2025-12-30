import { CELO_MAINNET_ID, CELO_SEPOLIA_ID, CELO_ALFAJORES_ID, LISK_MAINNET_ID, MANTLE_TESTNET_ID, MANTLE_MAINNET_ID } from "@/lib/contracts/config";

/**
 * Token interface for token configuration
 */
export interface Token {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  name: string;
}

/**
 * Centralized token configuration for all networks (Celo and Lisk)
 * 
 * Token addresses verified from official documentation:
 * - Celo Mainnet: https://docs.celo.org/developer-guide/celo-for-eth-devs
 * - Celo Sepolia: Celo Sepolia testnet
 * - Celo Alfajores: Celo Alfajores testnet (sunset after Sep 2025, but still supported)
 * - Good Dollar: https://docs.gooddollar.org/
 * - Lisk Mainnet: https://docs.lisk.com/about-lisk/deployed-tokens
 */
export const TOKENS_BY_NETWORK: Record<number, Token[]> = {
  // Celo Mainnet (chainId: 42220)
  [CELO_MAINNET_ID]: [
    { symbol: "CELO", address: "0x0000000000000000000000000000000000000000", decimals: 18, name: "Celo" },
    { symbol: "cUSD", address: "0x765DE816845861e75A25fCA122bb6898B8B1282a", decimals: 18, name: "Celo Dollar" },
    { symbol: "USDC", address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", decimals: 6, name: "USD Coin" },
    { symbol: "USDT", address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", decimals: 6, name: "Tether USD" },
    { symbol: "G$", address: "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A", decimals: 18, name: "Good Dollar" },
  ],
  // Celo Sepolia Testnet (chainId: 11142220)
  [CELO_SEPOLIA_ID]: [
    { symbol: "CELO", address: "0x0000000000000000000000000000000000000000", decimals: 18, name: "Celo" },
    { symbol: "cUSD", address: "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b", decimals: 18, name: "Celo Dollar" },
    { symbol: "USDC", address: "0x01C5C0122039549AD1493B8220cABEdD739BC44E", decimals: 6, name: "USD Coin" },
    { symbol: "USDT", address: "0xd077A400968890Eacc75cdc901F0356c943e4fDb", decimals: 6, name: "Tether USD" },
    // Test Good Dollar token deployed on Sepolia for testing
    { symbol: "G$", address: "0x66f653611e7b7aD22657c0F228CEE477050f0196", decimals: 18, name: "Good Dollar" },
  ],
  // Celo Alfajores Testnet (chainId: 44787)
  // Note: Alfajores is being sunset after September 2025, migrate to Sepolia
  [CELO_ALFAJORES_ID]: [
    { symbol: "CELO", address: "0x0000000000000000000000000000000000000000", decimals: 18, name: "Celo" },
    { symbol: "cUSD", address: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", decimals: 18, name: "Celo Dollar" },
    { symbol: "USDC", address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", decimals: 6, name: "USD Coin" },
    { symbol: "USDT", address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", decimals: 6, name: "Tether USD" },
  ],
  // Mantle Testnet (chainId: 5001)
  [MANTLE_TESTNET_ID]: [
    { symbol: "MNT", address: "0x0000000000000000000000000000000000000000", decimals: 18, name: "Mantle" },
    { symbol: "USDC", address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", decimals: 6, name: "USD Coin" },
    { symbol: "USDT", address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", decimals: 6, name: "Tether USD" },
  ],
  // Mantle Mainnet (chainId: 5000)
  [MANTLE_MAINNET_ID]: [
    { symbol: "MNT", address: "0x0000000000000000000000000000000000000000", decimals: 18, name: "Mantle" },
    { symbol: "USDC", address: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9", decimals: 6, name: "USD Coin" },
    { symbol: "USDT", address: "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE", decimals: 6, name: "Tether USD" },
  ],
  // Lisk Mainnet (chainId: 1135)
  // Token addresses from official Lisk documentation: https://docs.lisk.com/about-lisk/deployed-tokens
  // Note: Native currency is ETH, LSK is an ERC20 token
  [LISK_MAINNET_ID]: [
    { symbol: "ETH", address: "0x0000000000000000000000000000000000000000", decimals: 18, name: "Ethereum" },
    { symbol: "LSK", address: "0xac485391EB2d7D88253a7F1eF18C37f4242D1A24", decimals: 18, name: "Lisk" },
    { symbol: "USDC", address: "0xF242275d3a6527d877f2c927a82D9b057609cc71", decimals: 6, name: "USD Coin (Bridged)" },
    { symbol: "USDT", address: "0x05D032ac25d322df992303dCa074EE7392C117b9", decimals: 6, name: "Tether USD" },
  ],
};

/**
 * Get token by address for a specific network
 */
export function getTokenByAddress(
  address: `0x${string}`,
  chainId: number
): Token | undefined {
  // Try current network first, then fallback to Celo Sepolia
  const tokens = TOKENS_BY_NETWORK[chainId] || TOKENS_BY_NETWORK[MANTLE_TESTNET_ID];
  return tokens.find(
    (t) => t.address.toLowerCase() === address.toLowerCase()
  );
}

/**
 * Get all tokens for a specific network
 */
export function getTokensForNetwork(chainId: number): Token[] {
  // Return tokens for the specified network, fallback to Celo Sepolia if not found
  return TOKENS_BY_NETWORK[chainId] || TOKENS_BY_NETWORK[MANTLE_TESTNET_ID];
}

/**
 * Get token address by symbol for a specific network
 */
export function getTokenAddressBySymbol(
  symbol: string,
  chainId: number
): `0x${string}` | undefined {
  // Get tokens for the specified network, fallback to Celo Sepolia if not found
  const tokens = TOKENS_BY_NETWORK[chainId] || TOKENS_BY_NETWORK[MANTLE_TESTNET_ID];
  const token = tokens.find((t) => t.symbol.toUpperCase() === symbol.toUpperCase());
  return token?.address;
}

