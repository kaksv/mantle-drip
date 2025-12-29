"use client";

import { useAccount, useBalance, useChainId } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CELO_MAINNET_ID } from "@/lib/contracts/config";
import { getTokenAddressBySymbol } from "@/lib/tokens/config";

function BalanceDisplay({ address, token, symbol }: { address: `0x${string}`, token?: `0x${string}`, symbol: string }) {
  const { data, isLoading } = useBalance({
    address,
    token,
  });

  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{symbol}</span>
      <span className="font-medium">
        {isLoading ? "Loading..." : `${parseFloat(data?.formatted || '0').toFixed(4)}`}
      </span>
    </div>
  );
}

export function UserBalance() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  if (!isConnected || !address) {
    return null;
  }

  // Get token addresses for current network using centralized config
  // Fallback to mainnet if current network not supported
  const cUSD_ADDRESS = getTokenAddressBySymbol("cUSD", chainId) || getTokenAddressBySymbol("cUSD", CELO_MAINNET_ID);
  const USDC_ADDRESS = getTokenAddressBySymbol("USDC", chainId) || getTokenAddressBySymbol("USDC", CELO_MAINNET_ID);
  const USDT_ADDRESS = getTokenAddressBySymbol("USDT", chainId) || getTokenAddressBySymbol("USDT", CELO_MAINNET_ID);
  const GDOLLAR_ADDRESS = getTokenAddressBySymbol("G$", chainId) || getTokenAddressBySymbol("G$", CELO_MAINNET_ID);

  // Check if tokens are available on this network (not zero address)
  const isUSDTAvailable = USDT_ADDRESS && USDT_ADDRESS !== "0x0000000000000000000000000000000000000000";
  const isGDOLLARAvailable = GDOLLAR_ADDRESS && GDOLLAR_ADDRESS !== "0x0000000000000000000000000000000000000000";

  return (
    <Card className="glass-card w-full max-w-md mx-auto mb-8">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Connected Wallet</CardTitle>
        <p className="text-sm text-muted-foreground truncate pt-1">{address}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 pt-2 border-t">
          <BalanceDisplay address={address} symbol="CELO" token={undefined} />
          <BalanceDisplay address={address} token={cUSD_ADDRESS} symbol="cUSD" />
          <BalanceDisplay address={address} token={USDC_ADDRESS} symbol="USDC" />
          {isUSDTAvailable && (
            <BalanceDisplay address={address} token={USDT_ADDRESS} symbol="USDT" />
          )}
          {isGDOLLARAvailable && (
            <BalanceDisplay address={address} token={GDOLLAR_ADDRESS} symbol="G$" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
