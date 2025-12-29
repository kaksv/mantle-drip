"use client";

import { ConnectButton as RainbowKitConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ConnectButton() {
  const { isConnected } = useAccount();
  const [isMinipay, setIsMinipay] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted immediately on client side
    setMounted(true);
    // @ts-ignore
    if (typeof window !== "undefined" && window.ethereum?.isMiniPay) {
      setIsMinipay(true);
    }
  }, []);

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    // Return a placeholder button while loading to prevent layout shift
    return (
      <Button disabled className="h-10 opacity-50 cursor-not-allowed">
        Connect Wallet
      </Button>
    );
  }

  // Hide in MiniPay (auto-connects)
  if (isMinipay) {
    return null;
  }

  // Hide when connected (WalletButton will show instead)
  if (isConnected) {
    return null;
  }

  // Show RainbowKit connect button when not connected
  return (
    <div className="flex items-center connect-button-wrapper">
      <RainbowKitConnectButton />
    </div>
  );
}
