# Self Protocol Integration Implementation Plan

## Overview
This document outlines the phased implementation plan for integrating Self Protocol's privacy-first identity verification into the Drip payment platform's Identity tab.

## Goals
- Enable users to verify their identity using Self Protocol's zero-knowledge proof system
- Provide privacy-preserving identity verification alongside Good Dollar verification
- Integrate seamlessly into the existing Identity tab layout
- Support both frontend QR code generation and backend verification

---

## Phase 1: Foundation & Setup
**Duration:** ~1-2 hours

### Tasks:
1. **Install SDK Dependencies**
   - [ ] Install `@selfxyz/qrcode` - For QR code generation and display
   - [ ] Install `@selfxyz/core` - Core utilities and universal links
   - [ ] Verify `ethers` is available (should already be in project via viem/wagmi)
   - [ ] Check SDK version compatibility

2. **Environment Configuration**
   - [ ] Add environment variables for Self Protocol:
     - `NEXT_PUBLIC_SELF_APP_NAME` - Your app name
     - `NEXT_PUBLIC_SELF_SCOPE` - App scope identifier
     - `NEXT_PUBLIC_SELF_ENDPOINT` - Backend verification endpoint URL
     - `SELF_VERIFICATION_SECRET` - Secret for backend verification (server-side only)
   - [ ] Update `.env.example` with new variables
   - [ ] Document environment setup

3. **Type Definitions & Utilities**
   - [ ] Create `apps/web/src/lib/self-protocol/types.ts` for TypeScript types
   - [ ] Create `apps/web/src/lib/self-protocol/utils.ts` for helper functions
   - [ ] Create `apps/web/src/lib/self-protocol/constants.ts` for constants

### Deliverables:
- SDK packages installed and verified
- Environment variables configured
- Type definitions and utilities created
- Documentation updated

---

## Phase 2: Frontend SDK Integration
**Duration:** ~2-3 hours  
**Dependencies:** Phase 1

### Tasks:
1. **Create Self Protocol Hook**
   - [ ] Create `apps/web/src/lib/self-protocol/hooks/useSelfProtocol.ts`
   - [ ] Hook should:
     - Initialize SelfApp with configuration
     - Generate QR codes for verification
     - Handle verification state (pending, verified, error)
     - Manage universal links
     - Handle cayemtns, diellbacks after verification

2. **QR Code Component**
   - [ ] Create `apps/web/src/components/self-protocol/qr-code-verification.tsx`
   - [ ] Display QR code using `SelfQRcodeWrapper`
   - [ ] Show verification status
   - [ ] Handle deep linking for mobile
   - [ ] Display countdown/expiry for QR codes

3. **Verification Status Component**
   - [ ] Update `self-identity-card.tsx` to use the hook
   - [ ] Display verification status
   - [ ] Show QR code when verification is pending
   - [ ] Show success state when verified
   - [ ] Handle error states

### Deliverables:
- `useSelfProtocol` hook working
- QR code component functional
- Self Identity card updated with real functionality
- Users can scan QR codes to verify

---

## Phase 3: Backend Verification Endpoint
**Duration:** ~2-3 hours  
**Dependencies:** Phase 2

### Tasks:
1. **Create Verification API Route**
   - [ ] Create `apps/web/src/app/api/self/verify/route.ts`
   - [ ] Install backend SDK: `@selfxyz/backend` (if available) or use verification utilities
   - [ ] Implement proof verification logic
   - [ ] Validate disclosures (date of birth, minimum age, etc.)
   - [ ] Store verification status (optional: database)

2. **Security & Validation**
   - [ ] Verify proof signatures
   - [ ] Check proof expiry
   - [ ] Validate user address matches proof
   - [ ] Rate limiting for verification attempts
   - [ ] Error handling and logging

3. **Response Handling**
   - [ ] Return verification result (success/failure)
   - [ ] Include verification metadata
   - [ ] Handle edge cases (expired proofs, invalid signatures)

### Deliverables:
- Verification API endpoint functional
- Proof verification working
- Security measures implemented
- Error handling comprehensive

---

## Phase 4: Integration & Polish
**Duration:** ~1-2 hours  
**Dependencies:** Phase 3

### Tasks:
1. **Complete Self Identity Card**
   - [ ] Integrate QR code component
   - [ ] Connect to verification endpoint
   - [ ] Handle all states (initial, scanning, verified, error)
   - [ ] Add refresh/retry functionality

2. **User Experience**
   - [ ] Add loading states
   - [ ] Add success animations
   - [ ] Error messages with actionable guidance
   - [ ] Mobile-friendly QR code display
   - [ ] Deep link handling for mobile apps

3. **State Management**
   - [ ] Store verification status (localStorage or API)
   - [ ] Persist verification across sessions
   - [ ] Handle verification expiry
   - [ ] Refresh verification status

4. **Documentation**
   - [ ] Update README with Self Protocol feature
   - [ ] Add inline code comments
   - [ ] Document API endpoint usage

### Deliverables:
- Fully functional Self Identity card
- Smooth user experience
- Verification status persistence
- Documentation updated

---

## Phase 5: Testing & Refinement
**Duration:** ~1-2 hours  
**Dependencies:** Phase 4

### Tasks:
1. **Testing**
   - [ ] Test QR code generation
   - [ ] Test mobile app scanning
   - [ ] Test backend verification
   - [ ] Test error scenarios
   - [ ] Test verification expiry

2. **Refinement**
   - [ ] Fix any discovered issues
   - [ ] Improve UX based on testing
   - [ ] Optimize QR code refresh
   - [ ] Add analytics (optional)

### Deliverables:
- All tests passing
- No critical bugs
- Ready for production

---

## File Structure

```
apps/web/src/
├── lib/
│   └── self-protocol/
│       ├── types.ts              # TypeScript types
│       ├── utils.ts              # Helper functions
│       ├── constants.ts          # Constants
│       └── hooks/
│           └── useSelfProtocol.ts # Self Protocol hook
├── components/
│   └── self-protocol/
│       ├── self-identity-card.tsx        # Main identity card (already exists)
│       └── qr-code-verification.tsx      # QR code component
└── app/
    └── api/
        └── self/
            └── verify/
                └── route.ts      # Backend verification endpoint
```

---

## Environment Variables

Add to `.env` and `.env.example`:

```env
# Self Protocol Configuration
NEXT_PUBLIC_SELF_APP_NAME="Drip - Programmable Payments"
NEXT_PUBLIC_SELF_SCOPE="drip-payments"
NEXT_PUBLIC_SELF_ENDPOINT="https://your-api.com/api/self/verify"
# Server-side only
SELF_VERIFICATION_SECRET="your-verification-secret"
```

---

## Dependencies

To install:
- `@selfxyz/qrcode` - QR code generation
- `@selfxyz/core` - Core utilities
- `ethers` - Already available via viem/wagmi

---

## Self Protocol Flow

1. **User clicks "Verify with Self Protocol"**
   - Frontend generates SelfApp configuration
   - QR code is generated and displayed

2. **User scans QR code with Self mobile app**
   - Self app processes verification request
   - User completes verification in mobile app
   - Mobile app generates zero-knowledge proof

3. **Proof sent to backend**
   - Mobile app sends proof to verification endpoint
   - Backend verifies proof using Self SDK
   - Backend validates disclosures (age, etc.)

4. **Verification result**
   - Backend returns success/failure
   - Frontend updates verification status
   - User sees verified state

---

## Key Considerations

1. **Privacy**: Self Protocol uses zero-knowledge proofs - no personal data is exposed
2. **Mobile-first**: Users need the Self mobile app to verify
3. **Backend required**: Proof verification must happen server-side for security
4. **QR code expiry**: QR codes may expire - need to handle refresh
5. **Deep linking**: Support both QR codes and deep links for better UX

---

## Success Criteria

- [ ] Users can generate Self Protocol verification QR codes
- [ ] Users can scan QR codes with Self mobile app
- [ ] Backend successfully verifies proofs
- [ ] Verification status displays correctly
- [ ] Error handling is comprehensive
- [ ] UI matches app theme
- [ ] Mobile-friendly experience

---

## Timeline Estimate

- **Phase 1:** 1-2 hours
- **Phase 2:** 2-3 hours
- **Phase 3:** 2-3 hours
- **Phase 4:** 1-2 hours
- **Phase 5:** 1-2 hours

**Total:** ~7-12 hours of development time

---

## Next Steps

1. Review and approve this plan
2. Start with Phase 1 (Foundation & Setup)
3. Proceed through phases sequentially
4. Test thoroughly before moving to next phase
5. Deploy to production after Phase 5 completion

---

## Notes

- Self Protocol is privacy-first - no personal data is stored or exposed
- Verification is one-time per user (can be refreshed if needed)
- Works alongside Good Dollar verification (users can verify with both)
- Requires Self mobile app for scanning QR codes
- Backend verification is critical for security

