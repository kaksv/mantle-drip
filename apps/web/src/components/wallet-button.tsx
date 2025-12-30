"use client";

import { useAccount, useBalance, useChainId, useSwitchChain, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mantleTestnet, mantle, celo } from "wagmi/chains";
import { celoSepolia, liskMainnet, LISK_MAINNET_ID, MANTLE_TESTNET_ID, MANTLE_MAINNET_ID } from "@/lib/contracts/config";
import { formatEther } from "viem";
import { ChevronDown, LogOut } from "lucide-react";

// Support Mainnet, Sepolia testnet, Alfajores testnet, and Lisk mainnet
import { celoAlfajores } from "wagmi/chains";

const CHAINS = [
  { id: mantleTestnet.id, name: "Mantle Testnet" },
  { id: mantle.id, name: "Mantle Mainnet" },
  // { id: celo.id, name: "Celo Mainnet" },
  // { id: celoSepolia.id, name: "Celo Sepolia" },
  // { id: celoAlfajores.id, name: "Celo Alfajores" },
  // { id: liskMainnet.id, name: "Lisk Mainnet" },
];

interface WalletButtonProps {
  className?: string;
}

export function WalletButton({ className }: WalletButtonProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const { data: celoBalance, isLoading: balanceLoading } = useBalance({
    address,
    query: {
      enabled: !!address && isConnected,
    },
  });

  if (!isConnected || !address) {
    return null;
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const currentChain = CHAINS.find((chain) => chain.id === chainId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`gap-2 ${className || ""}`}>
          <span className="font-mono text-sm">{formatAddress(address)}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Network Switcher */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Network
        </DropdownMenuLabel>
        {CHAINS.map((chain) => (
          <DropdownMenuItem
            key={chain.id}
            onClick={() => switchChain({ chainId: chain.id })}
            className={chainId === chain.id ? "bg-accent" : ""}
          >
            {chain.name}
            {chainId === chain.id && " ✓"}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        {/* Balance */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Balance
        </DropdownMenuLabel>
        <DropdownMenuItem disabled>
          <span className="text-sm">
            {balanceLoading
              ? "Loading..."
              : celoBalance
              ? `${parseFloat(formatEther(celoBalance.value)).toFixed(4)} ${chainId === MANTLE_TESTNET_ID ? "MNT" : "ETH"}`
              : `0.0000 ${chainId === MANTLE_TESTNET_ID ? "MNT" : "ETH"}`}
          </span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Disconnect/Logout */}
        <DropdownMenuItem
          onClick={() => disconnect()}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect Wallet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

