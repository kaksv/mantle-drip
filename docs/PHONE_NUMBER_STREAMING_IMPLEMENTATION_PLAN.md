# Phone Number Streaming Implementation Plan

## Overview

This plan outlines the implementation of phone number-based streaming functionality in the Drip app, allowing users to create payment streams to phone numbers instead of wallet addresses. The implementation leverages Celo's ODIS (Oracle Distribution Infrastructure Service) and Federated Attestations to resolve phone numbers to wallet addresses.

## Architecture

### High-Level Flow

1. **User Input**: User enters phone number instead of wallet address
2. **Phone Verification** (Optional for recipients): Verify phone number ownership via Twilio SMS
3. **Address Resolution**: Use ODIS + Federated Attestations to resolve phone number to wallet address
4. **Stream Creation**: Create stream with resolved address (existing contract logic)
5. **Recipient Experience**: Recipients can register their phone number to receive streams

### Key Components

```
┌─────────────────┐
│  Frontend Form  │
│  (Phone Input)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Phone Service  │
│  (ODIS + FA)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Address Resolver│
│  (Lookup)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  DripCore       │
│  (Existing)     │
└─────────────────┘
```

## Dependencies

### New NPM Packages Required

```json
{
  "@celo/contractkit": "^4.0.0",
  "@celo/identity": "^3.0.1",
  "blind-threshold-bls": "https://github.com/celo-org/blind-threshold-bls-wasm#3d1013a",
  "bignumber.js": "^9.0.0"
}
```

### Environment Variables

Add to `.env.local`:

```env
# Phone Number Issuer Configuration
NEXT_PUBLIC_ISSUER_PRIVATE_KEY=0x... # Private key for issuer account
NEXT_PUBLIC_DEK_PRIVATE_KEY=0x...    # Data Encryption Key private key
NEXT_PUBLIC_DEK_PUBLIC_KEY=0x...     # Data Encryption Key public key (hex, no 0x prefix)

# Twilio Configuration (for phone verification)
NEXT_PUBLIC_TWILIO_URL=https://your-twilio-backend.com
# OR use Twilio SDK directly:
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_SID=...

# ODIS Configuration (usually defaults to Alfajores)
NEXT_PUBLIC_ODIS_CONTEXT=ALFAJORES  # or MAINNET
```

## Implementation Steps

### Phase 1: Core Infrastructure Setup

#### 1.1 Install Dependencies

```bash
cd apps/web
npm install @celo/contractkit@^4.0.0 @celo/identity@^3.0.1 bignumber.js
npm install --save-dev @types/bignumber.js
```

#### 1.2 Create Phone Number Service Layer

**File**: `apps/web/src/lib/services/phone-number-service.ts`

This service will handle:
- ODIS integration for phone number hashing
- Federated Attestations lookup
- Address resolution
- ODIS quota management

**Key Functions**:
- `getPhoneIdentifier(phoneNumber: string)`: Get obfuscated identifier from ODIS
- `resolvePhoneToAddress(phoneNumber: string)`: Lookup wallet address from phone number
- `registerPhoneNumber(phoneNumber: string, walletAddress: string)`: Register phone-to-address mapping
- `checkODISQuota()`: Check and top up ODIS quota if needed

#### 1.3 Create BLS Blinding Client

**File**: `apps/web/src/lib/services/bls-blinding-client.ts`

Copy and adapt from emisianto's implementation. This handles privacy-preserving phone number hashing.

#### 1.4 Create Twilio Service (Optional)

**File**: `apps/web/src/lib/services/twilio-service.ts`

For phone number verification:
- `sendSmsVerificationToken(phoneNumber: string)`
- `verifyToken(phoneNumber: string, code: string)`
- `validatePhoneNumber(phoneNumber: string)`

### Phase 2: Frontend Components

#### 2.1 Create Phone Number Input Component

**File**: `apps/web/src/components/phone-number-input.tsx`

Features:
- Phone number input with E.164 format validation
- Toggle between phone number and wallet address input
- Real-time validation
- Format helper (auto-format with country code)

#### 2.2 Create Phone Number Resolver Component

**File**: `apps/web/src/components/phone-number-resolver.tsx`

Features:
- Resolve phone number to address before stream creation
- Show loading state during resolution
- Handle errors (phone not registered, ODIS quota issues)
- Display resolved address to user

#### 2.3 Create Phone Registration Modal

**File**: `apps/web/src/components/phone-registration-modal.tsx`

Features:
- Allow users to register their phone number
- SMS verification flow (if using Twilio)
- Register attestation on-chain
- Success/error handling

#### 2.4 Update Create Stream Form

**File**: `apps/web/src/components/create-stream-form.tsx`

Changes:
- Add toggle/radio to choose between "Wallet Address" and "Phone Number"
- Update recipient input to accept phone numbers
- Integrate phone number resolver
- Update validation schema to accept phone numbers OR addresses
- Show resolved address in UI before submission

#### 2.5 Update Bulk Stream Creation

**File**: `apps/web/src/components/bulk-stream-creation.tsx`

Similar changes as create-stream-form for bulk operations.

### Phase 3: Integration & Logic

#### 3.1 Update Form Schema

Modify `streamSchema` in `create-stream-form.tsx`:

```typescript
const recipientSchema = z.object({
  type: z.enum(["address", "phone"]),
  value: z.string(), // Either address or phone number
  address: z.string().optional(), // Resolved address (for phone numbers)
  amountPerPeriod: z.string().min(1, "Amount required"),
});

// Add validation that checks:
// - If type is "address", value must be valid address
// - If type is "phone", value must be valid E.164 phone number
```

#### 3.2 Create Phone Resolution Hook

**File**: `apps/web/src/lib/hooks/use-phone-resolution.ts`

Custom hook that:
- Resolves phone numbers to addresses
- Caches resolved addresses
- Handles loading and error states
- Manages ODIS quota

#### 3.3 Update Stream Creation Logic

**File**: `apps/web/src/lib/contracts/hooks.ts` (or wherever `createStream` is called)

Before calling contract:
1. Check if recipient is phone number or address
2. If phone number, resolve to address first
3. Use resolved address for contract call
4. Store phone number mapping in UI state (for display purposes)

### Phase 4: User Registration Flow

#### 4.1 Create Phone Registration Page

**File**: `apps/web/src/app/phone/register/page.tsx`

Allow users to:
- Enter their phone number
- Verify via SMS (if using Twilio)
- Register their phone-to-address mapping
- View their registered phone numbers

#### 4.2 Create Phone Management Component

**File**: `apps/web/src/components/phone-management.tsx`

Features:
- View registered phone numbers
- Deregister phone numbers
- Add additional phone numbers

### Phase 5: Error Handling & Edge Cases

#### 5.1 Handle Unregistered Phone Numbers

When a phone number is not registered:
- Show clear error message
- Provide option to invite recipient to register
- Allow user to proceed with address input as fallback

#### 5.2 Handle ODIS Quota Issues

- Check quota before resolution
- Auto-top up if needed (requires cUSD allowance)
- Show clear error if quota exhausted and top-up fails
- Provide manual top-up option

#### 5.3 Handle Multiple Addresses

If a phone number maps to multiple addresses:
- Show list of addresses
- Let user select which address to use
- Default to first address with warning

#### 5.4 Handle Network Issues

- Retry logic for ODIS calls
- Timeout handling
- Fallback to direct address input

## Smart Contract Considerations

**No contract changes required!**

The existing `DripCore` contract works with addresses. The phone number resolution happens entirely in the frontend before calling the contract. The contract receives resolved addresses as it does now.

However, consider:
- Storing phone number metadata off-chain (in your database) for display purposes
- Creating a mapping table: `streamId -> recipientPhoneNumber` for UI purposes

## Database Schema Updates (Optional)

If using Prisma, add phone number tracking:

```prisma
model StreamPhoneMapping {
  id            String   @id @default(cuid())
  streamId      BigInt
  phoneNumber   String   // E.164 format
  address       String   // Resolved address
  createdAt     DateTime @default(now())
  
  @@index([streamId])
  @@index([phoneNumber])
}
```

## Testing Plan

### Unit Tests

1. Phone number validation (E.164 format)
2. ODIS identifier generation
3. Address resolution logic
4. Error handling scenarios

### Integration Tests

1. End-to-end phone registration flow
2. Phone-to-address resolution
3. Stream creation with phone numbers
4. ODIS quota management

### Manual Testing Checklist

- [ ] Register phone number
- [ ] Resolve phone number to address
- [ ] Create stream with phone number
- [ ] Handle unregistered phone number
- [ ] Handle ODIS quota exhaustion
- [ ] Handle network errors
- [ ] Verify SMS verification (if implemented)
- [ ] Test with multiple phone numbers
- [ ] Test bulk stream creation with phone numbers

## Security Considerations

1. **Private Keys**: Never expose issuer private keys in client-side code. Consider:
   - Using a backend API for ODIS operations
   - Or using a dedicated issuer account with minimal funds

2. **Phone Number Privacy**: 
   - Phone numbers are hashed via ODIS (privacy-preserving)
   - Consider rate limiting phone resolution requests

3. **SMS Verification**:
   - Implement rate limiting
   - Use Twilio Verify service (not raw SMS)
   - Validate phone numbers server-side

4. **Quota Management**:
   - Monitor ODIS quota usage
   - Set up alerts for low quota
   - Consider user limits to prevent abuse

## Performance Considerations

1. **Caching**: Cache resolved phone-to-address mappings
2. **Batching**: For bulk operations, batch ODIS lookups
3. **Lazy Loading**: Only resolve phone numbers when needed
4. **Debouncing**: Debounce phone number input validation

## User Experience Enhancements

1. **Phone Number Formatting**: Auto-format as user types
2. **Country Code Selector**: Dropdown for country codes
3. **Address Preview**: Show resolved address before stream creation
4. **Invite Flow**: Send invite to unregistered phone numbers
5. **Phone Number Display**: Show phone numbers in stream list (if available)

## Migration Path

1. **Phase 1**: Deploy phone resolution service (backend/API)
2. **Phase 2**: Add UI components (toggle between phone/address)
3. **Phase 3**: Enable phone number input (beta)
4. **Phase 4**: Full rollout with user education

## Estimated Timeline

- **Phase 1** (Infrastructure): 2-3 days
- **Phase 2** (Frontend Components): 2-3 days
- **Phase 3** (Integration): 1-2 days
- **Phase 4** (Registration Flow): 1-2 days
- **Phase 5** (Error Handling): 1-2 days
- **Testing & Polish**: 2-3 days

**Total**: ~10-15 days

## Resources

- [Celo ODIS Documentation](https://docs.celo.org/developer/identity/odis)
- [Federated Attestations](https://docs.celo.org/developer/identity/federated-attestations)
- [Emisianto Reference](https://github.com/celo-org/emisianto)
- [Twilio Verify API](https://www.twilio.com/docs/verify/api)

## Next Steps

1. Review and approve this plan
2. Set up issuer account and obtain private keys
3. Set up Twilio account (if using SMS verification)
4. Install dependencies
5. Begin Phase 1 implementation

