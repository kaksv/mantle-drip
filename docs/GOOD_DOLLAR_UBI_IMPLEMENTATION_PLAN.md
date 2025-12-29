# Good Dollar UBI Integration Implementation Plan

## Overview
This document outlines the phased implementation plan for integrating Good Dollar's Universal Basic Income (UBI) claiming feature into the Drip payment platform.

## Goals
- Enable users to claim G$ tokens directly within the Drip app
- Integrate UBI claiming with existing payment stream functionality
- Provide seamless user experience from verification to claiming to using G$ in streams
- Support both verified and unverified users with clear guidance

---

## Phase 1: Foundation & Setup
**Duration:** ~1-2 hours  
**Status:** ✅ SDK Already Installed

### Tasks:
1. ✅ **Install SDK Dependencies**
   - [x] Install `@goodsdks/citizen-sdk` (already done)
   - [ ] Verify package installation and exports
   - [ ] Check SDK version compatibility

2. **Environment Configuration**
   - [ ] Add environment variables for Good Dollar:
     - `NEXT_PUBLIC_GOODDOLLAR_ENV` (production/staging/development)
     - `NEXT_PUBLIC_GOODDOLLAR_RPC_URL` (optional, for custom RPC)
   - [ ] Update `.env.example` with new variables
   - [ ] Document environment setup

3. **Type Definitions & Utilities**
   - [ ] Create `apps/web/src/lib/gooddollar/types.ts` for TypeScript types
   - [ ] Create `apps/web/src/lib/gooddollar/utils.ts` for helper functions
   - [ ] Create `apps/web/src/lib/gooddollar/constants.ts` for constants

### Deliverables:
- SDK properly installed and verified
- Environment variables configured
- Type definitions and utilities created
- Documentation updated

---

## Phase 2: Identity SDK Integration
**Duration:** ~2-3 hours  
**Dependencies:** Phase 1

### Tasks:
1. **Create Identity SDK Hook**
   - [ ] Create `apps/web/src/lib/gooddollar/hooks/useIdentitySDK.ts`
   - [ ] Hook should:
     - Initialize IdentitySDK with Wagmi clients
     - Check whitelist status for connected wallet
     - Handle loading and error states
     - Cache identity status

2. **Identity Status Component**
   - [ ] Create `apps/web/src/components/gooddollar/identity-status.tsx`
   - [ ] Display:
     - Verification status (Verified/Not Verified)
     - Identity root address (if verified)
     - "Verify Identity" button (if not verified)
     - Loading states

3. **Face Verification Flow**
   - [ ] Create `apps/web/src/components/gooddollar/face-verification.tsx`
   - [ ] Generate face verification link
   - [ ] Handle callback after verification
   - [ ] Show verification progress/status

4. **Identity Tab Integration**
   - [ ] Update Treasury page to add "Identity" tab
   - [ ] Add identity status and face verification components to Identity tab
   - [ ] Ensure tab navigation works correctly (3 tabs: Dashboard, Management, Identity)

### Deliverables:
- `useIdentitySDK` hook working
- Identity status component functional
- Face verification flow implemented
- Identity tab added to Treasury page
- Users can verify their identity from the Identity tab

---

## Phase 3: Claim SDK Integration
**Duration:** ~3-4 hours  
**Dependencies:** Phase 2

### Tasks:
1. **Create Claim SDK Hook**
   - [ ] Create `apps/web/src/lib/gooddollar/hooks/useClaimSDK.ts`
   - [ ] Hook should:
     - Initialize ClaimSDK with IdentitySDK
     - Check entitlement (claimable amount)
     - Check claim status (can claim/already claimed)
     - Execute claim transaction
     - Handle transaction states (pending, success, error)

2. **Entitlement Checking**
   - [ ] Implement `checkEntitlement()` function
   - [ ] Display claimable amount in UI
   - [ ] Handle edge cases (no entitlement, already claimed)

3. **Claim Transaction Flow**
   - [ ] Create claim transaction handler
   - [ ] Show transaction progress (pending, confirming, success)
   - [ ] Handle transaction errors gracefully
   - [ ] Refresh balance after successful claim

4. **Next Claim Time**
   - [ ] Implement `nextClaimTime()` function
   - [ ] Display countdown timer for next claim
   - [ ] Show "Claim Available" when ready

### Deliverables:
- `useClaimSDK` hook working
- Entitlement checking functional
- Claim transaction flow complete
- Next claim time tracking implemented

---

## Phase 4: UI Components & Integration
**Duration:** ~4-5 hours  
**Dependencies:** Phase 3

### Tasks:
1. **Main UBI Component**
   - [ ] Create `apps/web/src/components/gooddollar/ubi-claim-card.tsx`
   - [ ] Component should:
     - Show identity status
     - Display claimable amount
     - Show claim button (if eligible)
     - Display next claim time
     - Handle all states (loading, error, success)

2. **Treasury Page Integration**
   - [ ] Add new "Identity" tab to Treasury page (3 tabs total: Dashboard, Management, Identity)
   - [ ] Add UBI claim card to Dashboard tab (alongside Token Balances)
   - [ ] Add identity verification components to Identity tab
   - [ ] Ensure responsive design
   - [ ] Match existing theme colors (green accents, glass-card style)

3. **Balance Integration**
   - [ ] Ensure G$ balance shows in `UserBalance` component (already done)
   - [ ] Auto-refresh balance after claim
   - [ ] Show G$ in token selector for streams/subscriptions

4. **Navigation (Optional)**
   - [ ] Consider adding "UBI" link to navbar (if needed)
   - [ ] Or keep it in Treasury page only

### Deliverables:
- UBI claim card component
- Integrated into Treasury page
- Balance updates after claiming
- UI matches app theme

---

## Phase 5: Advanced Features & Polish
**Duration:** ~2-3 hours  
**Dependencies:** Phase 4

### Tasks:
1. **Claim History**
   - [ ] Create `apps/web/src/components/gooddollar/claim-history.tsx`
   - [ ] Track recent claims (localStorage or API)
   - [ ] Display claim history in UBI card

2. **Notifications & Alerts**
   - [ ] Toast notifications for:
     - Successful claims
     - Claim failures
     - Verification completion
   - [ ] Error messages with actionable guidance

3. **Loading States & Skeletons**
   - [ ] Add skeleton loaders for all async operations
   - [ ] Smooth transitions between states
   - [ ] Optimistic UI updates

4. **Error Handling**
   - [ ] Comprehensive error handling:
     - Network errors
     - Transaction failures
     - SDK initialization errors
     - User-friendly error messages

5. **Documentation**
   - [ ] Update README with UBI feature
   - [ ] Add inline code comments
   - [ ] Create user guide (optional)

### Deliverables:
- Claim history feature
- Comprehensive error handling
- Polished UI with loading states
- Documentation updated

---

## Phase 6: Testing & Refinement
**Duration:** ~2-3 hours  
**Dependencies:** Phase 5

### Tasks:
1. **Unit Testing**
   - [ ] Test hooks (`useIdentitySDK`, `useClaimSDK`)
   - [ ] Test utility functions
   - [ ] Test error scenarios

2. **Integration Testing**
   - [ ] Test full flow: verification → claiming → using G$ in stream
   - [ ] Test on different networks (Sepolia, Mainnet)
   - [ ] Test with different wallet types

3. **User Testing**
   - [ ] Test with verified users
   - [ ] Test with unverified users
   - [ ] Test edge cases (low balance, network issues)

4. **Performance Optimization**
   - [ ] Optimize SDK initialization
   - [ ] Cache identity status
   - [ ] Reduce unnecessary re-renders

5. **Bug Fixes & Refinements**
   - [ ] Fix any discovered issues
   - [ ] Improve UX based on testing
   - [ ] Optimize transaction gas costs (if possible)

### Deliverables:
- All tests passing
- No critical bugs
- Performance optimized
- Ready for production

---

## File Structure

```
apps/web/src/
├── lib/
│   └── gooddollar/
│       ├── types.ts              # TypeScript types
│       ├── utils.ts              # Helper functions
│       ├── constants.ts           # Constants
│       └── hooks/
│           ├── useIdentitySDK.ts # Identity SDK hook
│           └── useClaimSDK.ts    # Claim SDK hook
├── components/
│   └── gooddollar/
│       ├── identity-status.tsx        # Identity verification status
│       ├── face-verification.tsx      # Face verification flow
│       ├── ubi-claim-card.tsx         # Main UBI claim component
│       └── claim-history.tsx          # Claim history (optional)
└── app/
    └── treasury/
        └── page.tsx                   # Updated with UBI card
```

---

## Environment Variables

Add to `.env` and `.env.example`:

```env
# Good Dollar UBI Configuration
NEXT_PUBLIC_GOODDOLLAR_ENV=production  # or 'staging' or 'development'
NEXT_PUBLIC_GOODDOLLAR_RPC_URL=        # Optional: custom RPC URL
```

---

## Dependencies

Already installed:
- ✅ `@goodsdks/citizen-sdk` - Good Dollar SDK
- ✅ `wagmi` - Wallet connection (already in project)
- ✅ `viem` - Blockchain interaction (already in project)

---

## Success Criteria

- [ ] Users can verify their identity through the app
- [ ] Verified users can check their claimable G$ amount
- [ ] Users can claim G$ tokens with one click
- [ ] Claimed G$ appears in wallet balance immediately
- [ ] Users can use G$ to create streams/subscriptions
- [ ] UI matches app theme and is responsive
- [ ] Error handling is comprehensive
- [ ] All edge cases are handled gracefully

---

## Timeline Estimate

- **Phase 1:** 1-2 hours
- **Phase 2:** 2-3 hours
- **Phase 3:** 3-4 hours
- **Phase 4:** 4-5 hours
- **Phase 5:** 2-3 hours
- **Phase 6:** 2-3 hours

**Total:** ~14-20 hours of development time

---

## Notes

- Start with Sepolia testnet for testing
- Use `'staging'` environment for development
- Switch to `'production'` for mainnet deployment
- Consider adding analytics to track claim success rates
- May want to add a "Learn More" link to Good Dollar docs

---

## Next Steps

1. Review and approve this plan
2. Start with Phase 1 (Foundation & Setup)
3. Proceed through phases sequentially
4. Test thoroughly before moving to next phase
5. Deploy to production after Phase 6 completion

