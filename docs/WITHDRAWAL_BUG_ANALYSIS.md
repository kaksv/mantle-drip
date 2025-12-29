# Partial Withdrawal Bug Analysis

## The Problem

When a recipient performs a **partial withdrawal**, the remaining balance that wasn't withdrawn gets "reset" and disappears.

## Root Cause

The issue is in how `getRecipientBalance` calculates the available balance after a partial withdrawal.

### What Happens During Partial Withdrawal:

**Scenario:** Recipient has 100 tokens available, withdraws 50 tokens

1. **`withdrawFromStream` is called:**
   - Line 377: Gets `availableBalance = 100`
   - Line 384: `withdrawn = 50`
   - Line 388: `_recipientTotalWithdrawn[streamId][recipient] += 50` ✅ (correctly tracks total withdrawn)
   - Line 389: `_recipientLastWithdraw[streamId][recipient] = block.timestamp` ❌ **THIS IS THE BUG**

2. **Next `getRecipientBalance` call:**
   - Line 220: `lastWithdraw = block.timestamp` (the time of withdrawal)
   - Line 240-259: Calculates `elapsedTime = effectiveEndTime - lastWithdraw`
   - Since `lastWithdraw` was just set to `block.timestamp`, `elapsedTime` will be 0 (or very small)
   - Line 261: `recipientAccrued = ratePerSecond * elapsedTime = ratePerSecond * 0 = 0`
   - Line 350: `balance = recipientAccrued = 0` (capped by remainingDeposit)

### The Bug:

**Line 389 in `withdrawFromStream`:**
```solidity
_recipientLastWithdraw[streamId][recipient] = block.timestamp;
```

This resets the `lastWithdraw` timestamp to the current time, which causes the balance calculation to start from scratch. The balance calculation is based on:
- `elapsedTime = currentTime - lastWithdraw`
- `recipientAccrued = ratePerSecond * elapsedTime`

When `lastWithdraw` is reset to `block.timestamp`, the next balance check will only show new accruals from that point forward, **not the remaining balance that was available but not withdrawn**.

## The Fix

The balance calculation should account for:
1. **Remaining unwithdrawn balance** = (what was available before withdrawal) - (what was withdrawn)
2. **Plus new accruals** since the withdrawal

### Solution Options:

**Option 1: Don't reset `lastWithdraw` on partial withdrawal**
- Only update `lastWithdraw` when withdrawing the full available balance
- This preserves the time-based calculation for remaining balance

**Option 2: Track remaining balance explicitly**
- Add a new mapping: `_recipientRemainingBalance[streamId][recipient]`
- On partial withdrawal: `_recipientRemainingBalance = availableBalance - withdrawn`
- In `getRecipientBalance`: Add remaining balance to new accruals

**Option 3: Calculate balance based on total allocation minus total withdrawn**
- Instead of time-based calculation, use: `totalAllocation - totalWithdrawn`
- This is more accurate but requires tracking total allocation per recipient

## Recommended Fix

**Option 1 is the simplest and most correct:**

```solidity
// In withdrawFromStream function, line 387-389:
// Update recipient tracking
_recipientTotalWithdrawn[streamId][recipient] += withdrawn;

// Only reset lastWithdraw if withdrawing the full available balance
if (withdrawn == availableBalance) {
    _recipientLastWithdraw[streamId][recipient] = block.timestamp;
}
// Otherwise, keep the existing lastWithdraw timestamp
// This preserves the remaining balance calculation
```

This way:
- Full withdrawal: Resets `lastWithdraw` (correct behavior)
- Partial withdrawal: Keeps `lastWithdraw` unchanged, so remaining balance continues to be calculated correctly

## Impact

- **Current behavior:** Partial withdrawals cause remaining balance to disappear
- **After fix:** Remaining balance is preserved and continues to accrue correctly


