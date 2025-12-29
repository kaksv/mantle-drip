# Good Dollar Implementation Comparison

## Overview
This document compares our custom implementation with the official GoodDollar SDKs repository patterns and identifies key differences and issues.

## Repository Structure

### Official GoodSDKs Repository
- **Location**: https://github.com/GoodDollar/GoodSDKs
- **Structure**: Monorepo with:
  - `packages/citizen-sdk` - Core SDK (what we're using)
  - `packages/react-hooks` - Pre-built React hooks (we're NOT using this)
  - `apps/demo-identity-app` - Official demo implementation

### Our Implementation
- **Using**: `@goodsdks/citizen-sdk` directly (v1.2.3)
- **Custom Hooks**: We created our own `useIdentitySDK` and `useClaimSDK` hooks
- **Not Using**: `@goodsdks/react-hooks` package (if it exists)

## Key Differences

### 1. **Hook Implementation**

#### Official Approach (Likely)
- Uses pre-built React hooks from `@goodsdks/react-hooks`
- Hooks handle state management, initialization, and error handling
- Built-in support for verification callbacks

#### Our Approach
- Custom hooks wrapping `@goodsdks/citizen-sdk` directly
- Manual state management
- Missing automatic callback handling

### 2. **Identity Verification Flow**

#### Issues in Our Implementation:

**Problem 1: No Automatic Refresh After Verification**
- **Location**: `apps/web/src/components/gooddollar/face-verification.tsx`
- **Issue**: When users return from face verification, we require manual page reload
- **Current Code**: Line 118 uses `window.location.reload()`
- **Missing**: Automatic detection of verification completion and status refresh

**Problem 2: ClaimSDK Initialization Dependency**
- **Location**: `apps/web/src/lib/gooddollar/hooks/useClaimSDK.ts`
- **Issue**: ClaimSDK only initializes when `identityStatus.isWhitelisted === true`
- **Problem**: If identity status isn't refreshed after verification, ClaimSDK never initializes
- **Current Code**: Lines 55-59 prevent initialization if not whitelisted

**Problem 3: No URL Parameter Detection**
- **Missing**: Detection of verification callback parameters in URL
- **Missing**: Automatic status check when returning from verification flow

**Problem 4: No Polling Mechanism**
- **Missing**: Automatic polling to check if user became whitelisted after verification
- **Comparison**: Self Protocol implementation has polling (see `useSelfProtocol.ts`)

### 3. **State Management**

#### Our Implementation Issues:

1. **Identity Status Not Reactive to Changes**
   - `useIdentitySDK` checks status once on mount
   - No mechanism to detect when status changes externally (after verification)

2. **ClaimSDK Dependency Chain**
   - ClaimSDK depends on IdentitySDK being ready AND user being whitelisted
   - If whitelist status changes, ClaimSDK should re-initialize, but it might not

3. **Missing Callback Handling**
   - No detection of verification completion
   - No automatic refresh when user returns from verification

## Recommended Fixes

### Fix 1: Add URL Parameter Detection
Detect when user returns from verification and automatically refresh status.

### Fix 2: Add Polling Mechanism
Poll identity status after verification link is generated to detect when user becomes whitelisted.

### Fix 3: Improve ClaimSDK Initialization
Ensure ClaimSDK re-initializes when identity status changes from false to true.

### Fix 4: Add Verification Callback Handler
Handle verification completion automatically without requiring page reload.

## Implementation Status

### ✅ What We Have:
- IdentitySDK initialization
- Face verification link generation
- ClaimSDK initialization (when whitelisted)
- Basic UI components

### ❌ What's Missing:
- Automatic status refresh after verification
- URL parameter detection for callbacks
- Polling mechanism for status changes
- Proper ClaimSDK re-initialization on status change

## Next Steps

1. Add URL parameter detection for verification callbacks
2. Implement polling mechanism for identity status
3. Fix ClaimSDK initialization to react to identity status changes
4. Add automatic refresh after verification completion
5. Consider using official `@goodsdks/react-hooks` if available



