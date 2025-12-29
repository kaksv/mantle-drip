# UBI Entitlement Fix - Showing 0 G$ Instead of 600 UBI

## Problem
User reported that the GoodDollar demo app shows 600 UBI available to claim, but our app shows 0 G$ for the same wallet address.

## Root Cause

The issue was in how we were retrieving and using the entitlement amount:

1. **Wrong Data Source**: We were primarily using `checkEntitlement()` which might return a different format or 0
2. **Missing Primary Source**: `getWalletClaimStatus()` returns an object with both `status` and `entitlement` - this is the authoritative source
3. **Not Using walletClaimStatus.entitlement**: The UI was only using the entitlement from the `entitlement` state, not from `walletClaimStatus`

## Solution

### 1. Enhanced `getWalletClaimStatus()` to Update Entitlement
**File**: `apps/web/src/lib/gooddollar/hooks/useClaimSDK.ts`

Updated `getWalletClaimStatus()` to:
- Extract entitlement from the status object
- Update the entitlement state with the value from `walletClaimStatus`
- This ensures we use the authoritative source

```typescript
// IMPORTANT: Use entitlement from walletClaimStatus if it's available
// This is the authoritative source for claimable amount
if (status && 'entitlement' in status && typeof status.entitlement === 'bigint') {
  const statusEntitlement = status.entitlement;
  
  // Update entitlement from wallet claim status if it's different or if current entitlement is 0
  if (statusEntitlement > 0n) {
    const altClaimAvailable = (status as any)?.altClaimAvailable ?? false;
    const entitlementData = createClaimEntitlement(
      statusEntitlement,
      altClaimAvailable
    );
    setEntitlement(entitlementData);
  }
}
```

### 2. Improved `checkEntitlement()` Parsing
**File**: `apps/web/src/lib/gooddollar/hooks/useClaimSDK.ts`

Enhanced the parsing to handle different return formats:
- Direct bigint
- Object with `entitlement` property
- Object with `amount` property
- Object with `value` property
- Added console logging for debugging

### 3. Updated UI to Use walletClaimStatus.entitlement
**File**: `apps/web/src/components/gooddollar/ubi-claim-card.tsx`

Changed the display to prioritize `walletClaimStatus.entitlement`:

```typescript
{/* Use entitlement from walletClaimStatus if available, otherwise fallback to entitlement state */}
{walletClaimStatus.entitlement && walletClaimStatus.entitlement > 0n
  ? formatEntitlement(walletClaimStatus.entitlement)
  : entitlement?.entitlementFormatted || "0"} G$
```

### 4. Fixed canClaim Logic
**File**: `apps/web/src/lib/gooddollar/hooks/useClaimSDK.ts`

Updated `canClaim` to check both sources:

```typescript
canClaim: (walletClaimStatus?.entitlement && walletClaimStatus.entitlement > 0n && walletClaimStatus.status === "can_claim") || 
          (entitlement?.canClaim ?? false),
```

### 5. Changed Initialization Order
**File**: `apps/web/src/lib/gooddollar/hooks/useClaimSDK.ts`

Changed the order to call `getWalletClaimStatus()` first (which updates entitlement), then `checkEntitlement()`:

```typescript
// Call getWalletClaimStatus first - it will update entitlement
getWalletClaimStatus().then(() => {
  // Then call checkEntitlement as a fallback/verification
  checkEntitlement();
  getNextClaimTime();
});
```

## Key Insight

The `getWalletClaimStatus()` method returns a `WalletClaimStatus` object that contains:
- `status`: "can_claim" | "already_claimed" | "not_whitelisted"
- `entitlement`: bigint - **This is the authoritative entitlement amount**
- `nextClaimTime?`: Date (optional)

This entitlement value matches what the demo app shows, so we should prioritize using it.

## Testing

After these changes:
1. ✅ `getWalletClaimStatus()` is called first
2. ✅ Entitlement from `walletClaimStatus` is used to update the entitlement state
3. ✅ UI displays the entitlement from `walletClaimStatus` if available
4. ✅ `canClaim` checks both sources
5. ✅ Console logs help debug if issues persist

## Expected Behavior

1. User connects wallet → ClaimSDK initializes
2. `getWalletClaimStatus()` is called → Returns status with entitlement (e.g., 600 G$)
3. Entitlement state is updated with the value from `walletClaimStatus`
4. UI displays the correct amount (600 G$ instead of 0 G$)
5. Claim button is enabled if status is "can_claim" and entitlement > 0

## Debugging

If the issue persists, check the browser console for:
- `"getWalletClaimStatus result:"` - Should show the status object with entitlement
- `"checkEntitlement result:"` - Should show what checkEntitlement returns

These logs will help identify if:
- The SDK is returning the correct data
- The parsing is working correctly
- There's a format mismatch



