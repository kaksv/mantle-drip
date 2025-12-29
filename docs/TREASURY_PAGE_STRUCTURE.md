# Treasury Page Structure with Identity Tab

## Updated Tab Structure

The Treasury page will now have **3 tabs**:

1. **Dashboard** - Financial overview and UBI claiming
2. **Management** - Bulk operations and controls
3. **Identity** - Good Dollar identity verification (NEW)

---

## Tab Layout

### Tab 1: Dashboard
**Icon:** BarChart3  
**Content:**
- Treasury Overview Cards (active streams, subscriptions, payments)
- Token Balances (including G$)
- **Good Dollar UBI Claim Card** (NEW - shows claimable amount, claim button)
- Financial Analytics

### Tab 2: Management
**Icon:** Settings  
**Content:**
- Bulk Stream Creation
- Batch Subscription Management
- Export Data
- Treasury Activity Log
- Budget Controls

### Tab 3: Identity (NEW)
**Icon:** UserCheck or Shield (to be determined)  
**Content:**
- **Identity Status Card**
  - Verification status (Verified/Not Verified)
  - Identity root address (if verified)
  - Last verification date
- **Face Verification Component**
  - "Verify Identity" button (if not verified)
  - Face verification link generation
  - Verification progress/status
  - Callback handling after verification
- **Identity Information**
  - What is Good Dollar identity?
  - Why verify?
  - Benefits of verification

---

## Visual Structure

```
┌─────────────────────────────────────────────────────────┐
│  Treasury                                                │
│  Manage your payment streams and subscriptions          │
├─────────────────────────────────────────────────────────┤
│  [Dashboard] [Management] [Identity] ← 3 tabs          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Identity Status                                 │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │ Status: ✓ Verified                         │  │  │
│  │  │ Identity Root: 0x1234...                  │  │  │
│  │  │ Last Verified: Jan 15, 2025               │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Face Verification                              │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │ [Verify Identity] button                  │  │  │
│  │  │ (if not verified)                         │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  About Identity Verification                     │  │
│  │  Information about Good Dollar identity...      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Component Organization

### Identity Tab Components

1. **Identity Status Card** (`identity-status.tsx`)
   - Shows current verification status
   - Displays identity root address
   - Shows verification date

2. **Face Verification Component** (`face-verification.tsx`)
   - Handles verification flow
   - Generates verification link
   - Manages verification state

3. **Identity Info Card** (optional)
   - Educational content about identity verification
   - Benefits of verification
   - Links to Good Dollar docs

---

## Implementation Notes

- The Identity tab will be added in **Phase 2** (Identity SDK Integration)
- The UBI claim card will be in the **Dashboard tab** (Phase 4)
- Both features work together: users verify in Identity tab, then claim in Dashboard tab
- Tab navigation should be smooth and responsive
- All components should match the app's theme (glass-card, green accents)

