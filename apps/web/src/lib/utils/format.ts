import { formatEther, formatUnits } from "viem";

/**
 * Format a token amount with 6 decimal places
 * @param value BigInt value in wei/smallest unit
 * @param decimals Number of decimals (18 for CELO, 6 for USDC/USDT)
 * @returns Formatted string with 6 decimal places
 */
export function formatTokenAmount(value: bigint, decimals: number = 18): string {
  if (value === 0n) return "0.000000";
  
  const formatted = decimals === 18 
    ? formatEther(value)
    : formatUnits(value, decimals);
  
  const num = parseFloat(formatted);
  
  // Handle very small numbers
  if (num === 0) return "0.000000";
  
  // Format to exactly 6 decimal places
  return num.toFixed(6);
}

/**
 * Format a token amount with a specific number of decimal places
 * @param value BigInt value in wei/smallest unit
 * @param decimals Number of decimals (18 for CELO, 6 for USDC/USDT)
 * @param decimalPlaces Number of decimal places to show
 * @returns Formatted string
 */
export function formatTokenAmountWithDecimals(
  value: bigint, 
  decimals: number = 18, 
  decimalPlaces: number = 6
): string {
  const formatted = decimals === 18 
    ? formatEther(value)
    : formatUnits(value, decimals);
  
  const num = parseFloat(formatted);
  
  // Handle very small numbers
  if (num === 0) return `0.${'0'.repeat(decimalPlaces)}`;
  
  // Format to specified decimal places, removing trailing zeros
  return num.toFixed(decimalPlaces).replace(/\.?0+$/, '');
}

