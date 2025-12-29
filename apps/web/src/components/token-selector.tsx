"use client";

import { useChainId } from "wagmi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CELO_SEPOLIA_ID } from "@/lib/contracts/config";
import { TOKENS_BY_NETWORK, getTokenByAddress, type Token } from "@/lib/tokens/config";

// Re-export Token interface for backward compatibility
export type { Token };

interface TokenSelectorProps {
  value?: `0x${string}`;
  onValueChange: (value: `0x${string}`) => void;
  disabled?: boolean;
}

export function TokenSelector({ value, onValueChange, disabled }: TokenSelectorProps) {
  const chainId = useChainId();
  const tokens = TOKENS_BY_NETWORK[chainId] || TOKENS_BY_NETWORK[CELO_SEPOLIA_ID];

  const selectedToken = tokens.find((t) => t.address === value);

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select token">
          {selectedToken ? `${selectedToken.symbol} (${selectedToken.name})` : "Select token"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {tokens.map((token) => (
          <SelectItem key={token.address} value={token.address}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{token.symbol}</span>
              <span className="text-muted-foreground text-sm">({token.name})</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Re-export getTokenByAddress for backward compatibility
export { getTokenByAddress };

