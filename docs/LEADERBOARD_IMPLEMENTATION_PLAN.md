# Leaderboard & Reward System Implementation Plan

## Overview
Implement a leaderboard system that tracks user activity (streams created, withdrawals claimed) and distributes a daily 50 CELO reward pool to top performers.

## Architecture: Hybrid Approach (Recommended)

### Why Hybrid?
- **On-chain tracking**: Transparent, verifiable metrics
- **Off-chain indexing**: Efficient queries, lower gas costs
- **On-chain distribution**: Trustless reward distribution

---

## Phase 1: Smart Contract - Leaderboard Tracking Contract

### 1.1 Create `Leaderboard.sol` Contract

**Location**: `apps/contracts/contracts/Leaderboard.sol`

**Features**:
- Track user metrics on-chain
- Calculate points based on activities
- Store daily leaderboard snapshots
- Distribute rewards

**Key Data Structures**:
```solidity
struct UserStats {
    uint256 streamsCreated;      // Total streams created
    uint256 withdrawalsClaimed;  // Total withdrawal transactions
    uint256 totalDeposited;      // Total amount deposited in streams
    uint256 totalWithdrawn;      // Total amount withdrawn as recipient
    uint256 points;              // Calculated points
    uint256 lastUpdated;         // Last update timestamp
}

struct DailyLeaderboard {
    uint256 day;                 // Day identifier (timestamp / 86400)
    address[] topUsers;          // Top users for the day
    uint256[] points;            // Points for each user
    uint256 rewardPool;          // CELO in reward pool
    bool distributed;            // Whether rewards were distributed
}
```

**Key Functions**:
```solidity
// Called by DripCore when stream is created
function recordStreamCreated(address user, uint256 deposit) external;

// Called by DripCore when withdrawal happens
function recordWithdrawal(address user, uint256 amount) external;

// Calculate points for a user
function calculatePoints(address user) external view returns (uint256);

// Get daily leaderboard
function getDailyLeaderboard(uint256 day) external view returns (address[] memory, uint256[] memory);

// Distribute rewards for a day (owner only, called at end of day)
function distributeDailyRewards(uint256 day) external;

// Get user's current stats
function getUserStats(address user) external view returns (UserStats memory);
```

**Points Calculation Formula**:
```
Points = (streamsCreated * 10) + 
         (withdrawalsClaimed * 5) + 
         (totalDeposited / 1e18) +  // 1 point per CELO deposited
         (totalWithdrawn / 1e18)    // 1 point per CELO withdrawn
```

### 1.2 Integration with DripCore

**Option A: Modify DripCore (Recommended)**
- Add `Leaderboard` contract reference
- Call leaderboard functions in `createStream()` and `withdrawFromStream()`
- Requires contract upgrade

**Option B: Event-Based Tracking**
- Keep DripCore unchanged
- Create indexer that listens to events
- Update leaderboard via separate transactions
- More gas efficient, but requires indexer

**Recommendation**: Option A for simplicity and immediate tracking

### 1.3 Reward Distribution Contract

**Features**:
- Hold 50 CELO reward pool
- Distribute proportionally to top N users
- Daily reset mechanism
- Owner can fund pool

**Distribution Formula**:
```
Top 10 users get rewards:
- 1st place: 30% (15 CELO)
- 2nd place: 20% (10 CELO)
- 3rd place: 15% (7.5 CELO)
- 4th-5th: 10% each (5 CELO each)
- 6th-10th: 3% each (1.5 CELO each)
```

---

## Phase 2: Backend/Indexer (Optional but Recommended)

### 2.1 Event Indexer

**Purpose**: Efficiently query leaderboard data without expensive on-chain calls

**Technology Options**:
- **TheGraph**: Decentralized indexing (best for production)
- **Custom Node.js Indexer**: Simple, centralized
- **Alchemy/Infura Webhooks**: Managed service

**What to Index**:
- `StreamCreated` events → Update `streamsCreated` count
- `StreamWithdrawn` events → Update `withdrawalsClaimed` count
- Calculate points in real-time
- Store daily leaderboard snapshots

### 2.2 API Endpoints (if using custom indexer)

```
GET /api/leaderboard/daily?day=20250102
GET /api/leaderboard/user/:address
GET /api/leaderboard/current
```

---

## Phase 3: Frontend Implementation

### 3.1 Leaderboard Page

**Location**: `apps/web/src/app/leaderboard/page.tsx`

**Components Needed**:
- `LeaderboardTable.tsx` - Display ranked users
- `UserRankCard.tsx` - Show user's current rank
- `RewardPoolDisplay.tsx` - Show current reward pool
- `DailyStats.tsx` - Show daily metrics

**Features**:
- Real-time leaderboard updates
- User's current rank highlight
- Historical leaderboard (previous days)
- Reward distribution history

### 3.2 Integration Points

**Update Navbar**: Add "Leaderboard" link

**Update Stream Cards**: Show user's current rank/points

**Dashboard Widget**: Show user's leaderboard position

---

## Phase 4: Reward Distribution Automation

### 4.1 Daily Distribution Script

**Location**: `apps/contracts/scripts/distribute-rewards.ts`

**Functionality**:
- Calculate previous day's leaderboard
- Distribute 50 CELO to top users
- Reset for new day
- Emit events for transparency

**Execution**:
- Cron job (via server/keeper)
- Manual trigger (owner)
- Automated via Gelato/Chainlink Automation

### 4.2 Reward Pool Management

**Funding**:
- Owner deposits 50 CELO daily
- Or: Auto-fund from platform fees
- Or: Community-funded pool

---

## Implementation Steps

### Step 1: Smart Contract Development (Week 1)
1. ✅ Create `Leaderboard.sol` contract
2. ✅ Write tests for leaderboard logic
3. ✅ Integrate with DripCore (modify or add hooks)
4. ✅ Deploy to testnet
5. ✅ Test reward distribution

### Step 2: Contract Upgrade (Week 1)
1. ✅ Add leaderboard integration to DripCore
2. ✅ Upgrade proxy on testnet
3. ✅ Test end-to-end flow
4. ✅ Upgrade on mainnet

### Step 3: Frontend Development (Week 2)
1. ✅ Create leaderboard page
2. ✅ Build leaderboard components
3. ✅ Add API hooks for leaderboard data
4. ✅ Integrate with existing UI
5. ✅ Add user rank display

### Step 4: Indexer/Backend (Week 2 - Optional)
1. ✅ Set up event indexer (if needed)
2. ✅ Create API endpoints
3. ✅ Test data accuracy

### Step 5: Automation (Week 3)
1. ✅ Set up daily distribution script
2. ✅ Configure automation (cron/Gelato)
3. ✅ Test reward distribution
4. ✅ Monitor first distribution

### Step 6: Testing & Launch (Week 3)
1. ✅ End-to-end testing
2. ✅ Security audit (if needed)
3. ✅ Mainnet deployment
4. ✅ Launch announcement

---

## Technical Details

### Contract Storage Layout
```solidity
mapping(address => UserStats) public userStats;
mapping(uint256 => DailyLeaderboard) public dailyLeaderboards;
uint256 public currentDay;
address public dripCore; // Reference to DripCore
uint256 public rewardPool; // Current reward pool balance
```

### Gas Optimization
- Use events for off-chain indexing
- Batch updates when possible
- Cache calculations
- Use `unchecked` for safe math operations

### Security Considerations
- Only DripCore can update stats (access control)
- Reentrancy guards on reward distribution
- Input validation
- Overflow protection

### Upgrade Path
- Leaderboard contract can be separate (no upgrade needed)
- Or: Add to DripCore as upgradeable module

---

## Alternative: Simpler On-Chain Only Approach

If you want to skip the indexer:

1. **Store leaderboard on-chain** (gas intensive but simple)
2. **Frontend queries contract directly** (slower but works)
3. **No backend needed**

**Trade-offs**:
- ✅ Simpler architecture
- ✅ Fully decentralized
- ❌ Higher gas costs
- ❌ Slower queries
- ❌ Limited historical data

---

## Metrics to Track

### Primary Metrics (for points):
1. **Streams Created** - Number of streams user created
2. **Withdrawals Claimed** - Number of withdrawal transactions
3. **Total Deposited** - Sum of all deposits (in CELO)
4. **Total Withdrawn** - Sum of all withdrawals (in CELO)

### Secondary Metrics (display only):
- Active streams count
- Total recipients across all streams
- Average stream duration
- Longest active stream

---

## Reward Distribution Schedule

**Daily at 00:00 UTC**:
1. Calculate previous day's leaderboard
2. Distribute 50 CELO to top 10 users
3. Reset metrics for new day (or cumulative?)
4. Emit distribution event

**Options**:
- **Daily Reset**: Points reset each day (competitive)
- **Cumulative**: Points accumulate over time (engagement)

**Recommendation**: Daily reset for fair competition

---

## Files to Create

### Contracts:
- `apps/contracts/contracts/Leaderboard.sol`
- `apps/contracts/test/Leaderboard.test.ts`
- `apps/contracts/scripts/distribute-rewards.ts`

### Frontend:
- `apps/web/src/app/leaderboard/page.tsx`
- `apps/web/src/components/leaderboard-table.tsx`
- `apps/web/src/components/user-rank-card.tsx`
- `apps/web/src/components/reward-pool-display.tsx`
- `apps/web/src/lib/contracts/hooks/useLeaderboard.ts`

### Backend (Optional):
- `apps/api/indexer/index.ts` (if custom indexer)
- `apps/api/routes/leaderboard.ts` (if API needed)

---

## Next Steps

1. **Decide on architecture**: Hybrid vs On-chain only
2. **Design points formula**: Finalize calculation
3. **Create Leaderboard contract**: Start with basic version
4. **Integrate with DripCore**: Add hooks/calls
5. **Build frontend**: Create leaderboard UI
6. **Set up automation**: Daily distribution

Would you like me to start implementing any specific part?

