# DripCore Contract - Features To Implement

This document outlines contract features to be added to the DripCore smart contract. Features are organized by priority.

---

## 🔴 High Priority - Core Functionality

### 1. Scheduled/Delayed Start Time
**Status:** Not Implemented  
**Priority:** High  
**Estimated Complexity:** Medium

**Description:**
Add ability to create streams that start at a future time, rather than immediately.

**Implementation:**
- Add optional `startTime` parameter to `createStream()` function
- If `startTime` is 0 or in the past, stream starts immediately (current behavior)
- If `startTime` is in the future, stream status is `Pending` until start time
- Stream automatically transitions to `Active` when `block.timestamp >= startTime`
- Recipients cannot withdraw until stream is active

**Function Signature:**
```solidity
function createStream(
    address[] calldata recipients,
    address token,
    uint256[] calldata amountsPerPeriod,
    uint256 periodSeconds,
    uint256 deposit,
    uint256 startTime,  // NEW: 0 for immediate start, or future timestamp
    string calldata title,
    string calldata description
) external payable nonReentrant returns (uint256 streamId);
```

**Events:**
- `StreamStarted(uint256 indexed streamId)` - Emitted when scheduled stream starts

**Use Cases:**
- Schedule payments for future dates
- Set up recurring streams in advance
- Plan payroll or rent payments ahead of time

---

### 2. Stream Extension
**Status:** Not Implemented  
**Priority:** High  
**Estimated Complexity:** Medium

**Description:**
Allow extending an active stream's duration by adding more deposit and time.

**Implementation:**
- `extendStream(uint256 streamId, uint256 additionalDuration, uint256 additionalDeposit)`
- Only sender can extend
- Recalculate rates for all recipients based on new total duration
- Handle paused time correctly
- Calculate required additional deposit based on remaining recipients

**Function Signature:**
```solidity
function extendStream(
    uint256 streamId,
    uint256 additionalDuration,  // Additional seconds to add
    uint256 additionalDeposit    // Additional deposit required
) external payable nonReentrant;
```

**Events:**
- `StreamExtended(uint256 indexed streamId, uint256 newEndTime, uint256 additionalDeposit)`

**Use Cases:**
- Extend ongoing salary streams
- Continue rent payments for another month
- Prolong service subscriptions

---

### 3. Stream Ownership Transfer
**Status:** Not Implemented  
**Priority:** High  
**Estimated Complexity:** Low

**Description:**
Transfer control of a stream to another address (new owner can pause/resume/cancel).

**Implementation:**
- `transferStreamOwnership(uint256 streamId, address newOwner)`
- Only current sender can transfer
- Update `stream.sender` to new owner
- Update `_senderStreams` mappings
- New owner gets all management rights

**Function Signature:**
```solidity
function transferStreamOwnership(
    uint256 streamId,
    address newOwner
) external;
```

**Events:**
- `StreamOwnershipTransferred(uint256 indexed streamId, address indexed oldOwner, address indexed newOwner)`

**Use Cases:**
- Organizational changes
- Account migrations
- Transferring payment responsibilities

---

## 🟡 Medium Priority - Efficiency & Control

### 4. Batch Operations
**Status:** Not Implemented  
**Priority:** Medium  
**Estimated Complexity:** Medium

**Description:**
Gas-efficient functions to manage multiple streams at once.

**Implementation:**
- `pauseMultipleStreams(uint256[] calldata streamIds)`
- `resumeMultipleStreams(uint256[] calldata streamIds)`
- `cancelMultipleStreams(uint256[] calldata streamIds)`
- `addMultipleRecipients(uint256 streamId, address[] calldata recipients, uint256[] calldata amountsPerPeriod, uint256 additionalDeposit)`

**Function Signatures:**
```solidity
function pauseMultipleStreams(uint256[] calldata streamIds) external;
function resumeMultipleStreams(uint256[] calldata streamIds) external;
function cancelMultipleStreams(uint256[] calldata streamIds) external nonReentrant;
function addMultipleRecipients(
    uint256 streamId,
    address[] calldata recipients,
    uint256[] calldata amountsPerPeriod,
    uint256 additionalDeposit
) external payable nonReentrant;
```

**Events:**
- `StreamsBatchPaused(uint256[] indexed streamIds, address indexed by)`
- `StreamsBatchResumed(uint256[] indexed streamIds, address indexed by)`
- `StreamsBatchCancelled(uint256[] indexed streamIds, address indexed by)`

**Use Cases:**
- Pause all streams during emergency
- Bulk recipient management
- Gas savings for treasury operations

---

### 5. Stream Delegation
**Status:** Not Implemented  
**Priority:** Medium  
**Estimated Complexity:** Medium

**Description:**
Allow delegating stream management rights to another address without transferring ownership.

**Implementation:**
- `delegateStreamManagement(uint256 streamId, address delegate)`
- `revokeStreamDelegation(uint256 streamId)`
- Delegate can pause/resume/cancel but cannot transfer ownership
- Sender retains ownership and can revoke delegation
- Mapping: `mapping(uint256 => address) private _streamDelegates;`

**Function Signatures:**
```solidity
function delegateStreamManagement(
    uint256 streamId,
    address delegate
) external;

function revokeStreamDelegation(uint256 streamId) external;
```

**Events:**
- `StreamDelegated(uint256 indexed streamId, address indexed delegate)`
- `StreamDelegationRevoked(uint256 indexed streamId)`

**Use Cases:**
- Allow team members to manage streams
- Temporary management access
- Multi-signature scenarios

---

### 6. Query Functions with Filters
**Status:** Not Implemented  
**Priority:** Medium  
**Estimated Complexity:** Low-Medium

**Description:**
Efficient query functions to filter streams by various criteria.

**Implementation:**
- `getStreamsByStatus(StreamStatus status) returns (Stream[] memory)`
- `getStreamsByToken(address token) returns (Stream[] memory)`
- `getStreamsByDateRange(uint256 startDate, uint256 endDate) returns (Stream[] memory)`
- `getStreamsBySender(address sender, StreamStatus status) returns (Stream[] memory)`

**Function Signatures:**
```solidity
function getStreamsByStatus(StreamStatus status) external view returns (Stream[] memory);
function getStreamsByToken(address token) external view returns (Stream[] memory);
function getStreamsByDateRange(
    uint256 startDate,
    uint256 endDate
) external view returns (Stream[] memory);
function getStreamsBySender(
    address sender,
    StreamStatus status
) external view returns (Stream[] memory);
```

**Use Cases:**
- Analytics and reporting
- Frontend filtering
- Treasury management
- Audit and compliance

---

## 🟢 Advanced Features

### 7. Stream Splitting
**Status:** Not Implemented  
**Priority:** Low  
**Estimated Complexity:** High

**Description:**
Split one stream into multiple smaller streams, redistributing recipients and funds.

**Implementation:**
- `splitStream(uint256 streamId, address[] calldata newRecipients, uint256[] calldata newAmounts)`
- Cancel original stream
- Create new streams with specified recipients
- Refund remaining deposit proportionally
- Handle paused time correctly

**Function Signature:**
```solidity
function splitStream(
    uint256 streamId,
    address[] calldata newRecipients,
    uint256[] calldata newAmounts,
    uint256[] calldata newPeriodSeconds
) external nonReentrant returns (uint256[] memory newStreamIds);
```

**Events:**
- `StreamSplit(uint256 indexed originalStreamId, uint256[] indexed newStreamIds)`

**Use Cases:**
- Reallocating payments
- Splitting large streams into smaller ones
- Restructuring payment schedules

---

### 8. Emergency Pause (Owner)
**Status:** Not Implemented  
**Priority:** Medium  
**Estimated Complexity:** Low

**Description:**
Owner-only functions to pause/resume all streams in emergency situations.

**Implementation:**
- `emergencyPauseAll()` - Pause all active streams
- `emergencyResumeAll()` - Resume all paused streams
- `emergencyPauseByToken(address token)` - Pause all streams for a specific token
- Track emergency pause state separately from user pauses

**Function Signatures:**
```solidity
function emergencyPauseAll() external onlyOwner;
function emergencyResumeAll() external onlyOwner;
function emergencyPauseByToken(address token) external onlyOwner;
```

**Events:**
- `EmergencyPauseAll(address indexed by)`
- `EmergencyResumeAll(address indexed by)`
- `EmergencyPauseByToken(address indexed token, address indexed by)`

**Use Cases:**
- Security incidents
- Token issues
- Contract upgrades
- Regulatory compliance

---

### 9. Aggregate Statistics
**Status:** Not Implemented  
**Priority:** Low  
**Estimated Complexity:** Low

**Description:**
View functions to get aggregate statistics about all streams.

**Implementation:**
- `getTotalStreams() returns (uint256)`
- `getTotalDeposited(address token) returns (uint256)`
- `getTotalDistributed(address token) returns (uint256)`
- `getActiveStreamsCount() returns (uint256)`
- `getStreamsCountByStatus(StreamStatus status) returns (uint256)`

**Function Signatures:**
```solidity
function getTotalStreams() external view returns (uint256);
function getTotalDeposited(address token) external view returns (uint256);
function getTotalDistributed(address token) external view returns (uint256);
function getActiveStreamsCount() external view returns (uint256);
function getStreamsCountByStatus(StreamStatus status) external view returns (uint256);
```

**Use Cases:**
- Analytics dashboard
- Treasury reporting
- Platform metrics
- Public statistics

---

### 10. Stream Metadata Updates
**Status:** Not Implemented  
**Priority:** Low  
**Estimated Complexity:** Low

**Description:**
Allow updating stream title and description after creation.

**Implementation:**
- `updateStreamMetadata(uint256 streamId, string calldata newTitle, string calldata newDescription)`
- Only sender can update
- Validate length constraints

**Function Signature:**
```solidity
function updateStreamMetadata(
    uint256 streamId,
    string calldata newTitle,
    string calldata newDescription
) external;
```

**Events:**
- `StreamMetadataUpdated(uint256 indexed streamId, string newTitle, string newDescription)`

**Use Cases:**
- Correcting typos
- Updating descriptions
- Adding notes after creation

---

## 🔵 Nice to Have

### 11. Withdrawal Limits
**Status:** Not Implemented  
**Priority:** Low  
**Estimated Complexity:** Medium

**Description:**
Add per-recipient withdrawal limits (max withdrawal per period).

**Implementation:**
- Add `maxWithdrawalPerPeriod` to recipient info
- Enforce limits in `withdrawFromStream()`
- Optional parameter in `createStream()` and `addRecipient()`

**Use Cases:**
- Budget controls
- Rate limiting
- Fraud prevention

---

### 12. Stream Cloning
**Status:** Not Implemented  
**Priority:** Low  
**Estimated Complexity:** Medium

**Description:**
Create a new stream with same settings as an existing stream.

**Implementation:**
- `cloneStream(uint256 streamId, address[] calldata newRecipients)`
- Copy all settings except recipients
- Useful for recurring similar streams

**Use Cases:**
- Monthly recurring payments
- Template-based creation
- Quick duplication

---

### 13. Stream Expiration Handling
**Status:** Not Implemented  
**Priority:** Low  
**Estimated Complexity:** Medium

**Description:**
Automatic handling of expired streams (auto-complete, auto-refund).

**Implementation:**
- Auto-complete streams when `block.timestamp >= endTime`
- Auto-refund remaining deposits
- Batch processing function

**Use Cases:**
- Cleanup expired streams
- Automatic refunds
- Gas optimization

---

## Implementation Notes

### Gas Optimization Considerations
- Batch operations should use loops efficiently
- Query functions may need pagination for large datasets
- Consider using events for off-chain indexing instead of on-chain storage

### Security Considerations
- All new functions should follow existing access control patterns
- Maintain reentrancy guards where needed
- Validate all inputs thoroughly
- Consider upgradeability if adding many features

### Testing Requirements
- Unit tests for each new function
- Integration tests for complex features
- Gas usage benchmarks
- Edge case testing

### Migration Strategy
- Some features may require contract upgrades
- Consider proxy pattern for upgradability
- Maintain backward compatibility where possible

---

## Priority Order Recommendation

1. **Scheduled Start Time** - High value, medium complexity
2. **Stream Extension** - High value, medium complexity  
3. **Stream Ownership Transfer** - High value, low complexity
4. **Batch Operations** - Medium value, medium complexity
5. **Query Functions with Filters** - Medium value, low complexity
6. **Stream Delegation** - Medium value, medium complexity
7. **Emergency Pause** - Medium value, low complexity
8. **Aggregate Statistics** - Low value, low complexity
9. **Stream Metadata Updates** - Low value, low complexity
10. **Stream Splitting** - Low value, high complexity
11. **Withdrawal Limits** - Low value, medium complexity
12. **Stream Cloning** - Low value, medium complexity
13. **Stream Expiration Handling** - Low value, medium complexity

---

**Last Updated:** 2024
**Status:** Planning Phase

