/**
 * Constants for Good Dollar UBI integration
 */

import type { GoodDollarEnv } from "./types";

/**
 * Default Good Dollar environment
 * Can be overridden via NEXT_PUBLIC_GOODDOLLAR_ENV environment variable
 */
export const DEFAULT_GOODDOLLAR_ENV: GoodDollarEnv =
  (process.env.NEXT_PUBLIC_GOODDOLLAR_ENV as GoodDollarEnv) || "staging";

/**
 * Supported chain IDs for Good Dollar
 * Celo Mainnet: 42220
 * Celo Sepolia: 11142220 (testnet)
 */
export const SUPPORTED_CHAIN_IDS = {
  CELO_MAINNET: 42220,
  CELO_SEPOLIA: 11142220,
} as const;

/**
 * Get the appropriate Good Dollar environment based on chain ID
 * 
 * Note: The demo app uses "development" environment, which has different
 * contract addresses and UBI pools than "staging" or "production".
 * 
 * To match the demo app, set NEXT_PUBLIC_GOODDOLLAR_ENV=development
 */
export function getGoodDollarEnvForChain(chainId: number): GoodDollarEnv {
  // If explicitly set, use that (allows overriding to "development" to match demo)
  if (process.env.NEXT_PUBLIC_GOODDOLLAR_ENV) {
    const env = process.env.NEXT_PUBLIC_GOODDOLLAR_ENV as GoodDollarEnv;
    console.log(`[GoodDollar] Using environment from env var: ${env}`);
    return env;
  }

  // Otherwise, determine based on chain ID
  if (chainId === SUPPORTED_CHAIN_IDS.CELO_MAINNET) {
    console.log(`[GoodDollar] Using production environment for mainnet (chainId: ${chainId})`);
    return "production";
  } else if (chainId === SUPPORTED_CHAIN_IDS.CELO_SEPOLIA) {
    console.log(`[GoodDollar] Using staging environment for Sepolia (chainId: ${chainId})`);
    return "staging";
  }

  // Default to staging for safety
  console.log(`[GoodDollar] Using default staging environment (chainId: ${chainId})`);
  return "staging";
}

/**
 * Good Dollar documentation URLs
 */
export const GOODDOLLAR_DOCS = {
  MAIN: "https://docs.gooddollar.org",
  UBI: "https://docs.gooddollar.org/frequently-asked-questions/about-gooddollar",
  IDENTITY: "https://docs.gooddollar.org/for-developers/apis-and-sdks/sybil-resistance/identity-ethers-v5-react",
  CLAIMS: "https://docs.gooddollar.org/for-developers/apis-and-sdks/ubi/claim-ubi-viem-wagmi",
} as const;

