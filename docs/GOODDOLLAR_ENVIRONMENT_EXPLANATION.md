# Good Dollar Environment Differences - Why UBI Amounts Differ

## Problem
The GoodDollar demo app shows **616.82 UBI** but our app shows **198.48 G$** for the same wallet address.

## Root Cause: Different Environments

The GoodDollar SDK supports three environments, each with different contract addresses and UBI pools:

### 1. **"development"** Environment
- Used by the demo app (`demo-identity-dev.vercel.app`)
- Development contracts with test UBI pools
- Shows: **616.82 UBI** (in the demo)
- Purpose: Testing and development

### 2. **"staging"** Environment  
- Used by our app when on Celo Sepolia (chainId: 11142220)
- Staging contracts with different UBI pools
- Shows: **198.48 G$** (in our app)
- Purpose: Pre-production testing

### 3. **"production"** Environment
- Used by our app when on Celo Mainnet (chainId: 42220)
- Production contracts with real UBI pools
- Purpose: Live production use

## Why They're Different

Each environment has:
- **Different contract addresses** for UBI distribution
- **Different UBI pools** with different amounts
- **Different identity contracts**
- **Different claim schedules**

This is **expected behavior** - they are separate systems for different purposes.

## Current Configuration

### Our App's Logic:
```typescript
// From constants.ts
function getGoodDollarEnvForChain(chainId: number): GoodDollarEnv {
  if (chainId === 42220) {        // Celo Mainnet
    return "production";
  } else if (chainId === 11142220) { // Celo Sepolia
    return "staging";
  }
  return "staging"; // Default
}
```

### Demo App:
- Uses **"development"** environment explicitly
- Disclaimer states: "This demo uses the development contract"

## Solutions

### Option 1: Use Development Environment (Match Demo)
To match the demo app exactly, set the environment variable:

```env
NEXT_PUBLIC_GOODDOLLAR_ENV=development
```

This will force the app to use the development environment regardless of chain ID.

### Option 2: Keep Current Setup (Recommended)
Keep using staging/production based on chain ID:
- **Sepolia** → `staging` (for testing)
- **Mainnet** → `production` (for real use)

This is the correct setup for production apps.

### Option 3: Add Environment Selector
Add a UI toggle to let users switch between environments (for testing only).

## Which Should You Use?

### For Development/Testing:
- Use `development` to match the demo app
- Use `staging` for more realistic testing

### For Production:
- Use `production` on mainnet
- Use `staging` on testnet

## How to Change

1. **Set Environment Variable:**
   ```bash
   # In .env.local
   NEXT_PUBLIC_GOODDOLLAR_ENV=development
   ```

2. **Restart the app:**
   ```bash
   npm run dev
   ```

3. **Verify:**
   - Check browser console for environment logs
   - UBI amount should match demo (if using development)

## Important Notes

- **Different environments = Different amounts** - This is normal!
- **Development environment** is for testing only
- **Staging environment** is closer to production
- **Production environment** is for real users

## Verification

To verify which environment is being used, check the browser console:
- Look for SDK initialization logs
- Check the contract addresses being used
- Compare with demo app's contract addresses



