"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { formatUnits } from "viem";
import { useChainId } from "wagmi";
import { CELO_SEPOLIA_ID } from "@/lib/contracts/config";
import { TOKENS_BY_NETWORK } from "@/lib/tokens/config";
import { useMemo } from "react";

interface TokenBalancesProps {
  tokenBalances: Record<
    string,
    { balance: bigint; decimals: number; symbol: string }
  >;
}

export function TokenBalances({ tokenBalances }: TokenBalancesProps) {
  const chainId = useChainId();
  
  // Get token addresses for the current network
  const tokens = TOKENS_BY_NETWORK[chainId] || TOKENS_BY_NETWORK[CELO_SEPOLIA_ID];
  
  // Always show cUSD, USDC, USDT, G$ (if available), and CELO
  const requiredTokens = useMemo(() => {
    const requiredSymbols = ["cUSD", "USDC", "USDT", "G$", "CELO"];
    // Filter to only include tokens that exist on the current network
    return tokens.filter(t => requiredSymbols.includes(t.symbol));
  }, [tokens]);

  // Merge actual balances with required tokens, showing 0 for missing ones
  const displayTokens = useMemo(() => {
    return requiredTokens.map(token => {
      const existingBalance = tokenBalances[token.address];
      if (existingBalance) {
        return {
          address: token.address,
          balance: existingBalance.balance,
          decimals: existingBalance.decimals,
          symbol: existingBalance.symbol,
        };
      }
      // Return 0 balance for tokens not in the treasury
      return {
        address: token.address,
        balance: 0n,
        decimals: token.decimals,
        symbol: token.symbol,
      };
    });
  }, [requiredTokens, tokenBalances]);

  // Also include any other tokens that might be in the treasury but not in the required list
  const otherTokens = useMemo(() => {
    return Object.entries(tokenBalances)
      .filter(([address]) => {
        // Check if this token is not in the required tokens list
        return !requiredTokens.some(t => t.address.toLowerCase() === address.toLowerCase());
      })
      .map(([address, data]) => ({
        address,
        ...data,
      }));
  }, [tokenBalances, requiredTokens]);

  const allTokens = [...displayTokens, ...otherTokens];

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Token Balances (Escrowed Funds)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Total balances across all streams and subscriptions
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {allTokens.map(({ address, balance, decimals, symbol }) => {
            const formattedBalance = formatUnits(balance, decimals);
            const displayBalance = parseFloat(formattedBalance).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            });

            return (
              <div
                key={address}
                className="p-3 md:p-4 rounded-lg border bg-background/50 backdrop-blur-sm"
              >
                <p className="text-xs md:text-sm text-muted-foreground mb-1">{symbol}</p>
                <p className="text-lg md:text-2xl font-bold">{displayBalance}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                  {address === "0x0000000000000000000000000000000000000000"
                    ? "Native CELO"
                    : `${address.slice(0, 6)}...${address.slice(-4)}`}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

