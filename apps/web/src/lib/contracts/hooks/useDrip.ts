"use client";

import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { getContractAddress, CONTRACT_ADDRESSES, CELO_SEPOLIA_ID } from "../config";
import { DRIP_CORE_ABI } from "../abis";
import { parseEther, parseUnits, formatEther, formatUnits, maxUint256 } from "viem";
import { useMemo } from "react";
import { getTokenByAddress } from "@/components/token-selector";
import { usePublicClient } from "wagmi";

// Standard ERC20 ABI for approval, allowance, and balance checks
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
] as const;

/**
 * Hook for interacting with DripCore contract
 */
export function useDrip() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const contractAddress = useMemo(() => {
    return getContractAddress(chainId, "DripCore");
  }, [chainId]);

  /**
   * Check token allowance for DripCore contract
   */
  const checkTokenAllowance = async (token: `0x${string}`, amount: bigint): Promise<boolean> => {
    if (!address || !contractAddress || !publicClient) return false;
    if (token === "0x0000000000000000000000000000000000000000") return true; // Native token doesn't need approval

    try {
      const allowance = (await publicClient.readContract({
        address: token,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, contractAddress],
      })) as bigint;

      return allowance >= amount;
    } catch (error) {
      console.error("Error checking allowance:", error);
      return false;
    }
  };

  /**
   * Check token balance for user
   */
  const checkTokenBalance = async (token: `0x${string}`, amount: bigint): Promise<{ hasBalance: boolean; balance: bigint }> => {
    if (!address || !publicClient) return { hasBalance: false, balance: 0n };
    
    try {
      // Log network info for debugging
      const currentChainId = publicClient.chain?.id || chainId;
      console.log("Checking balance:", {
        address,
        token,
        chainId: currentChainId,
        amount: amount.toString(),
      });

      if (token === "0x0000000000000000000000000000000000000000") {
        // Native CELO balance
        const balance = await publicClient.getBalance({ address });
        console.log("CELO balance:", formatEther(balance));
        return { hasBalance: balance >= amount, balance };
      } else {
        // ERC20 token balance
        const balance = await publicClient.readContract({
          address: token,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address],
        }) as bigint;
        
        const tokenInfo = getTokenByAddress(token, currentChainId);
        const decimals = tokenInfo?.decimals || 18;
        console.log("Token balance:", {
          token,
          symbol: tokenInfo?.symbol || "unknown",
          balance: balance.toString(),
          formatted: formatUnits(balance, decimals),
          chainId: currentChainId,
        });
        
        return { hasBalance: balance >= amount, balance };
      }
    } catch (error) {
      console.error("Error checking balance:", error);
      return { hasBalance: false, balance: 0n };
    }
  };

  /**
   * Approve token spending for DripCore contract
   */
  const approveToken = async (token: `0x${string}`, amount: bigint) => {
    if (!address || !contractAddress) {
      throw new Error("Wallet not connected or contract not deployed");
    }

    return writeContract({
      address: token,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [contractAddress, amount],
    });
  };

  /**
   * Create a new payment stream
   * @param recipients Array of recipient addresses
   * @param token Token address (address(0) for native CELO)
   * @param amountsPerPeriod Array of amounts per period for each recipient (human-readable)
   * @param periodSeconds Duration of each period in seconds
   * @param deposit Total deposit amount (human-readable)
   * @param title Optional title
   * @param description Optional description
   */
  const createStream = async (
    recipients: `0x${string}`[],
    token: `0x${string}`, // Token address (address(0) for native CELO)
    amountsPerPeriod: string[], // Human-readable amounts (e.g., "100", "50")
    periodSeconds: number, // Period duration in seconds
    deposit: string, // Total deposit (human-readable)
    title: string = "",
    description: string = ""
  ) => {
    if (!contractAddress) {
      throw new Error("DripCore contract not deployed on this network");
    }

    // Get token decimals from token info
    const tokenInfo = getTokenByAddress(token, chainId);
    const decimals = tokenInfo?.decimals || 18;

    // Validate deposit is not zero
    if (!deposit || deposit === "0" || parseFloat(deposit) <= 0) {
      throw new Error("Deposit amount must be greater than 0");
    }

    // Validate amounts per period
    for (const amount of amountsPerPeriod) {
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error("All recipient amounts must be greater than 0");
      }
    }

    // Convert amounts using correct decimals for the token
    const amountsInWei = amountsPerPeriod.map((amount, index) => {
      try {
        // Validate the amount is a valid number
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
          throw new Error(`Recipient ${index + 1} amount must be greater than 0`);
        }
        
        // Parse with the token's specific decimals
        const parsed = parseUnits(amount, decimals);
        
        if (parsed === 0n) {
          throw new Error(
            `Recipient ${index + 1} amount "${amount}" is too small for ${tokenInfo?.symbol || "token"} ` +
            `(decimals: ${decimals}). Minimum: ${formatUnits(1n, decimals)}`
          );
        }
        
        console.log(`Amount conversion for recipient ${index + 1}:`, {
          original: amount,
          decimals,
          parsed: parsed.toString(),
          formatted: formatUnits(parsed, decimals),
        });
        
        return parsed;
      } catch (error: any) {
        throw new Error(`Invalid amount for recipient ${index + 1}: ${amount}. ${error?.message || ""}`);
      }
    });
    
    const depositInWei = (() => {
      try {
        // Ensure deposit string is valid
        const depositNum = parseFloat(deposit);
        if (isNaN(depositNum) || depositNum <= 0) {
          throw new Error(`Deposit must be a positive number. Got: ${deposit}`);
        }
        
        const parsed = parseUnits(deposit, decimals);
        if (parsed === 0n) {
          throw new Error(`Deposit amount is too small or zero after conversion. Original: ${deposit}, Decimals: ${decimals}`);
        }
        
        console.log("Deposit conversion:", {
          original: deposit,
          decimals,
          parsed: parsed.toString(),
          formatted: formatUnits(parsed, decimals),
        });
        
        return parsed;
      } catch (error: any) {
        throw new Error(`Invalid deposit format: ${deposit}. ${error?.message || ""}`);
      }
    })();

    // Validate amounts in wei are not zero
    for (let i = 0; i < amountsInWei.length; i++) {
      if (amountsInWei[i] === 0n) {
        throw new Error(`Recipient ${i + 1} amount is too small or zero: ${amountsPerPeriod[i]}`);
      }
    }

    // For native CELO, send the deposit as value
    const isNativeToken = token === "0x0000000000000000000000000000000000000000";
    
    // Calculate total amount needed (deposit + platform fee)
    // Platform fee is 0.5% (50 bps), so total = deposit / 0.995
    const platformFeeBps = 50; // 0.5%
    const totalNeeded = (depositInWei * BigInt(10000)) / BigInt(10000 - platformFeeBps);
    
    // Check balance first (before approval check)
    if (address && publicClient) {
      try {
        const { hasBalance, balance } = await checkTokenBalance(token, totalNeeded);
        if (!hasBalance) {
          throw new Error(
            `Insufficient ${tokenInfo?.symbol || "token"} balance. ` +
            `You need ${formatUnits(totalNeeded, decimals)} ${tokenInfo?.symbol || "tokens"} ` +
            `(deposit: ${formatUnits(depositInWei, decimals)} + fee: ${formatUnits(totalNeeded - depositInWei, decimals)}), ` +
            `but you only have ${formatUnits(balance, decimals)} ${tokenInfo?.symbol || "tokens"}. ` +
            `Please add more ${tokenInfo?.symbol || "tokens"} to your wallet.`
          );
        }
      } catch (error: any) {
        // If it's already our custom error, rethrow it
        if (error?.message?.includes("Insufficient")) {
          throw error;
        }
        // Otherwise, log and continue (might be a network error)
        console.error("Error checking balance:", error);
      }
    }
    
    // For ERC20 tokens, check and request approval if needed
    if (!isNativeToken && address && publicClient) {
      // Check current allowance
      try {
        const currentAllowance = await publicClient.readContract({
          address: token,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, contractAddress],
        }) as bigint;

        // If allowance is insufficient, throw error with helpful message
        if (currentAllowance < totalNeeded) {
          throw new Error(
            `Insufficient token approval. Please approve ${tokenInfo?.symbol || "token"} spending first. ` +
            `The contract needs approval to transfer ${formatUnits(totalNeeded, decimals)} ${tokenInfo?.symbol || "tokens"}. ` +
            `Current allowance: ${formatUnits(currentAllowance, decimals)} ${tokenInfo?.symbol || "tokens"}.`
          );
        }
      } catch (error: any) {
        // If it's already our custom error, rethrow it
        if (error?.message?.includes("Insufficient")) {
          throw error;
        }
        // Otherwise, log and continue (might be a network error, let the transaction fail naturally)
        console.error("Error checking allowance:", error);
      }
    }
    
    // Final validation before sending
    console.log("Final stream creation parameters:", {
      recipients,
      token,
      tokenSymbol: tokenInfo?.symbol,
      decimals,
      amountsPerPeriod,
      amountsInWei: amountsInWei.map(a => a.toString()),
      periodSeconds,
      deposit,
      depositInWei: depositInWei.toString(),
      isNativeToken,
    });

    const baseContract = {
      address: contractAddress,
      abi: DRIP_CORE_ABI,
      functionName: "createStream" as const,
      args: [recipients, token, amountsInWei, BigInt(periodSeconds), depositInWei, title, description],
    };
    
    return writeContract(
      (isNativeToken ? { ...baseContract, value: depositInWei } : baseContract) as any
    );
  };

  /**
   * Pause a stream
   */
  const pauseStream = async (streamId: bigint) => {
    if (!contractAddress) {
      throw new Error("DripCore contract not deployed on this network");
    }

    return writeContract({
      address: contractAddress,
      abi: DRIP_CORE_ABI,
      functionName: "pauseStream",
      args: [streamId],
    });
  };

  /**
   * Resume a paused stream
   */
  const resumeStream = async (streamId: bigint) => {
    if (!contractAddress) {
      throw new Error("DripCore contract not deployed on this network");
    }

    return writeContract({
      address: contractAddress,
      abi: DRIP_CORE_ABI,
      functionName: "resumeStream",
      args: [streamId],
    });
  };

  /**
   * Cancel a stream
   */
  const cancelStream = async (streamId: bigint) => {
    if (!contractAddress) {
      throw new Error("DripCore contract not deployed on this network");
    }

    return writeContract({
      address: contractAddress,
      abi: DRIP_CORE_ABI,
      functionName: "cancelStream",
      args: [streamId],
    });
  };

  /**
   * Withdraw all available balance from a stream (as recipient)
   * @param streamId Stream ID
   * @param recipient Recipient address
   */
  const withdrawFromStream = async (streamId: bigint, recipient: `0x${string}`) => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected. Please connect your wallet first.");
    }

    if (!contractAddress) {
      throw new Error("DripCore contract not deployed on this network");
    }

    if (address.toLowerCase() !== recipient.toLowerCase()) {
      throw new Error("You can only withdraw your own balance");
    }

    try {
      return await writeContract({
        address: contractAddress,
        abi: DRIP_CORE_ABI,
        functionName: "withdrawFromStream",
        args: [streamId, recipient],
      });
    } catch (error: any) {
      console.error("Error in withdrawFromStream:", error);
      // Re-throw with a more user-friendly message if possible
      if (error?.message) {
        throw error;
      }
      throw new Error("Failed to initiate withdrawal. Please check that MetaMask is open and try again.");
    }
  };

  /**
   * Add a recipient to an existing stream
   * @param streamId Stream ID
   * @param recipient New recipient address
   * @param amountPerPeriod Amount per period (human-readable)
   * @param additionalDeposit Additional deposit required (human-readable)
   * @param token Token address (to determine if native payment needed)
   */
  const addRecipient = async (
    streamId: bigint,
    recipient: `0x${string}`,
    amountPerPeriod: string,
    additionalDeposit: string,
    token: `0x${string}`
  ) => {
    if (!contractAddress) {
      throw new Error("DripCore contract not deployed on this network");
    }

    // Get token decimals from token info
    const tokenInfo = getTokenByAddress(token, chainId);
    const decimals = tokenInfo?.decimals || 18;

    const amountPerPeriodInWei = parseUnits(amountPerPeriod, decimals);
    const depositInWei = parseUnits(additionalDeposit, decimals);

    const isNativeToken = token === "0x0000000000000000000000000000000000000000";

    const baseContract = {
      address: contractAddress,
      abi: DRIP_CORE_ABI,
      functionName: "addRecipient" as const,
      args: [streamId, recipient, amountPerPeriodInWei, depositInWei],
    };

    return writeContract(
      (isNativeToken ? { ...baseContract, value: depositInWei } : baseContract) as any
    );
  };

  /**
   * Remove a recipient from an existing stream
   */
  const removeRecipient = async (
    streamId: bigint,
    recipient: `0x${string}`
  ) => {
    if (!contractAddress) {
      throw new Error("DripCore contract not deployed on this network");
    }

    return writeContract({
      address: contractAddress,
      abi: DRIP_CORE_ABI,
      functionName: "removeRecipient",
      args: [streamId, recipient],
    });
  };

  /**
   * Update a recipient's rate in an existing stream
   * @param streamId Stream ID
   * @param recipient Recipient address
   * @param newAmountPerPeriod New amount per period (human-readable)
   * @param additionalDeposit Additional deposit if increasing rate (human-readable)
   * @param token Token address (to determine if native payment needed)
   */
  const updateRecipientRate = async (
    streamId: bigint,
    recipient: `0x${string}`,
    newAmountPerPeriod: string,
    additionalDeposit: string,
    token: `0x${string}`
  ) => {
    if (!contractAddress) {
      throw new Error("DripCore contract not deployed on this network");
    }

    // Get token decimals from token info
    const tokenInfo = getTokenByAddress(token, chainId);
    const decimals = tokenInfo?.decimals || 18;

    const amountPerPeriodInWei = parseUnits(newAmountPerPeriod, decimals);
    const depositInWei = parseUnits(additionalDeposit, decimals);

    const isNativeToken = token === "0x0000000000000000000000000000000000000000";

    const baseContract = {
      address: contractAddress,
      abi: DRIP_CORE_ABI,
      functionName: "updateRecipientRate" as const,
      args: [streamId, recipient, amountPerPeriodInWei, depositInWei],
    };

    return writeContract(
      (isNativeToken ? { ...baseContract, value: depositInWei } : baseContract) as any
    );
  };

  /**
   * Lock stream rate for a duration
   * @param streamId Stream ID
   * @param lockDuration Duration in seconds to lock the rates
   */
  const lockStreamRate = async (streamId: bigint, lockDuration: number) => {
    if (!contractAddress) {
      throw new Error("DripCore contract not deployed on this network");
    }

    return writeContract({
      address: contractAddress,
      abi: DRIP_CORE_ABI,
      functionName: "lockStreamRate",
      args: [streamId, BigInt(lockDuration)],
    });
  };

  /**
   * Extend stream duration and/or add deposit
   * @param streamId Stream ID
   * @param newEndTime New end time timestamp (0 to keep current, or future timestamp to extend)
   * @param depositAmount Additional deposit amount (human-readable, 0 for no deposit)
   * @param token Token address (for native payment detection and decimals)
   */
  const extendStream = async (
    streamId: bigint,
    newEndTime: number,
    depositAmount: string,
    token: `0x${string}`
  ) => {
    if (!contractAddress) {
      throw new Error("DripCore contract not deployed on this network");
    }

    // Get token decimals from token info
    const tokenInfo = getTokenByAddress(token, chainId);
    const decimals = tokenInfo?.decimals || 18;

    const depositAmountInWei = depositAmount === "0" || depositAmount === "" 
      ? 0n 
      : parseUnits(depositAmount, decimals);

    const isNativeToken = token === "0x0000000000000000000000000000000000000000";

    const baseContract = {
      address: contractAddress,
      abi: DRIP_CORE_ABI,
      functionName: "extendStream" as const,
      args: [streamId, BigInt(newEndTime), depositAmountInWei],
    };

    return writeContract(
      (isNativeToken && depositAmountInWei > 0n 
        ? { ...baseContract, value: depositAmountInWei } 
        : baseContract) as any
    );
  };

  /**
   * Emergency withdrawal - withdraw ALL funds from contract (owner only)
   * @param tokens Array of ERC20 token addresses to withdraw (can be empty if only withdrawing native)
   * @param to Address to send all funds to
   */
  const emergencyWithdrawAll = async (
    tokens: `0x${string}`[],
    to: `0x${string}`
  ) => {
    if (!contractAddress) {
      throw new Error("DripCore contract not deployed on this network");
    }

    return writeContract({
      address: contractAddress,
      abi: DRIP_CORE_ABI,
      functionName: "emergencyWithdrawAll" as const,
      args: [tokens, to],
    });
  };

  /**
   * Get contract balances for multiple tokens (view function)
   * @param tokens Array of token addresses to check (use address(0) for native CELO)
   * @returns Array of balances corresponding to the tokens array
   */
  const getContractBalances = async (
    tokens: `0x${string}`[]
  ): Promise<bigint[]> => {
    if (!contractAddress || !publicClient) {
      throw new Error("Contract not available");
    }

    const balances = await publicClient.readContract({
      address: contractAddress,
      abi: DRIP_CORE_ABI,
      functionName: "getContractBalances",
      args: [tokens],
    });

    return balances as bigint[];
  };

  return {
    contractAddress,
    isConnected,
    createStream,
    pauseStream,
    resumeStream,
    cancelStream,
    withdrawFromStream,
    addRecipient,
    removeRecipient,
    updateRecipientRate,
    lockStreamRate,
    extendStream,
    checkTokenAllowance,
    checkTokenBalance,
    approveToken,
    emergencyWithdrawAll,
    getContractBalances,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error,
  };
}

/**
 * Hook for reading stream data
 */
export function useStream(streamId: bigint | undefined) {
  const chainId = useChainId();
  const contractAddress = useMemo(() => {
    return getContractAddress(chainId, "DripCore");
  }, [chainId]);

  const { data: stream, isLoading, error, refetch } = useReadContract({
    address: contractAddress || undefined,
    abi: DRIP_CORE_ABI,
    functionName: "getStream",
    args: streamId !== undefined ? [streamId] : undefined,
    query: {
      enabled: !!streamId && !!contractAddress,
    },
  });

  return { stream, isLoading, error, refetch };
}

/**
 * Hook for getting recipient balance in a stream
 */
export function useRecipientBalance(streamId: bigint | undefined, recipient: `0x${string}` | undefined) {
  const chainId = useChainId();
  const contractAddress = useMemo(() => {
    return getContractAddress(chainId, "DripCore");
  }, [chainId]);

  const { data: balance, isLoading, error, refetch } = useReadContract({
    address: contractAddress || undefined,
    abi: DRIP_CORE_ABI,
    functionName: "getRecipientBalance",
    args: streamId !== undefined && recipient ? [streamId, recipient] : undefined,
    query: {
      enabled: !!streamId && !!recipient && !!contractAddress,
    },
  });

  return { balance, isLoading, error, refetch };
}

/**
 * Hook for getting user's streams
 */
export function useUserStreams(userAddress: `0x${string}` | undefined) {
  const chainId = useChainId();
  const contractAddress = useMemo(() => {
    return getContractAddress(chainId, "DripCore");
  }, [chainId]);

  // Note: This assumes there's a function to get user streams
  // You may need to implement this differently based on your contract
  const { data: streamIds, isLoading, error } = useReadContract({
    address: contractAddress || undefined,
    abi: DRIP_CORE_ABI,
    functionName: "getUserStreams",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!contractAddress,
    },
  });

  return { streamIds, isLoading, error };
}

/**
 * Hook for getting stream rate lock status
 * @param streamId Stream ID
 * @returns Rate lock information including whether locked, lock until timestamp, and time remaining
 */
export function useStreamRateLockStatus(streamId: bigint | undefined) {
  const chainId = useChainId();
  const contractAddress = useMemo(() => {
    return getContractAddress(chainId, "DripCore");
  }, [chainId]);

  const { data: stream, isLoading, error } = useReadContract({
    address: contractAddress || undefined,
    abi: DRIP_CORE_ABI,
    functionName: "getStream",
    args: streamId !== undefined ? [streamId] : undefined,
    query: {
      enabled: !!streamId && !!contractAddress,
      refetchInterval: 30000, // Refetch every 30 seconds to update lock status
    },
  });

  const rateLockStatus = useMemo(() => {
    if (!stream || !streamId) {
      return {
        isLocked: false,
        lockUntil: null,
        timeRemaining: null,
        isLoading,
        error,
      };
    }

    // Stream data is a tuple, we need to access rateLockUntil
    // The structure is: [streamId, sender, recipients, token, deposit, startTime, endTime, status, rateLockUntil, title, description]
    const streamData = stream as any;
    const rateLockUntil = streamData.rateLockUntil 
      ? BigInt(streamData.rateLockUntil) 
      : 0n;

    const now = BigInt(Math.floor(Date.now() / 1000));
    const isLocked = rateLockUntil > 0n && rateLockUntil > now;

    let timeRemaining: string | null = null;
    if (isLocked) {
      const remainingSeconds = Number(rateLockUntil - now);
      const days = Math.floor(remainingSeconds / 86400);
      const hours = Math.floor((remainingSeconds % 86400) / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      
      if (days > 0) {
        timeRemaining = `${days}d ${hours}h`;
      } else if (hours > 0) {
        timeRemaining = `${hours}h ${minutes}m`;
      } else {
        timeRemaining = `${minutes}m`;
      }
    }

    return {
      isLocked,
      lockUntil: rateLockUntil > 0n ? Number(rateLockUntil) : null,
      timeRemaining,
      isLoading,
      error,
    };
  }, [stream, streamId, isLoading, error]);

  return rateLockStatus;
}

