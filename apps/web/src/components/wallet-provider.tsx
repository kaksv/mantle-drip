"use client";

import { RainbowKitProvider, connectorsForWallets, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { WagmiProvider, createConfig, http, useConnect } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { defineChain } from "viem";
import { ConnectButton } from "./connect-button";
import { liskMainnet } from "@/lib/contracts/config";

// Define Celo Sepolia manually if not exported from wagmi/chains
const celoSepolia = defineChain({
  id: 11142220,
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

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [injectedWallet],
    },
  ],
  {
    appName: "Drip - Programmable Payments",
    projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "default-project-id",
  }
);

// Support Mainnet, Sepolia testnet, Alfajores testnet, and Lisk mainnet
const wagmiConfig = createConfig({
  chains: [celo, celoSepolia, celoAlfajores, liskMainnet],
  connectors,
  transports: {
    [celo.id]: http(),
    [celoSepolia.id]: http(),
    [celoAlfajores.id]: http(),
    [liskMainnet.id]: http(),
  },
  ssr: true,
});

// Optimized QueryClient configuration for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 30 seconds before considering it stale
      staleTime: 30 * 1000,
      // Keep unused data in cache for 5 minutes
      gcTime: 5 * 60 * 1000, // Previously cacheTime
      // Retry failed requests 2 times
      retry: 2,
      // Refetch on window focus only if data is stale
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect by default (can be overridden per query)
      refetchOnReconnect: false,
      // Reduce network requests by not refetching on mount if data exists
      refetchOnMount: false,
    },
  },
});

// Custom RainbowKit theme with green accent color matching Create Stream button
const customTheme = darkTheme({
  accentColor: "#10B981", // Green matching Create Stream button
  accentColorForeground: "white",
  borderRadius: "medium",
  fontStack: "system",
  overlayBlur: "small",
});

function WalletProviderInner({ children }: { children: React.ReactNode }) {
  const { connect, connectors } = useConnect();

  useEffect(() => {
    // Check if the app is running inside MiniPay
    if (window.ethereum && window.ethereum.isMiniPay) {
      // Find the injected connector, which is what MiniPay uses
      const injectedConnector = connectors.find((c) => c.id === "injected");
      if (injectedConnector) {
        connect({ connector: injectedConnector });
      }
    }
  }, [connect, connectors]);

  return <>{children}</>;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customTheme}>
          <WalletProviderInner>{children}</WalletProviderInner>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
