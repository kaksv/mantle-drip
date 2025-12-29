# Withdrawal Failure Analysis

## Transaction Details
- **Hash**: `0x250db6f617d34dd00689e3b124adfc0a01cca45ef74615a776922513ee8533b3`
- **Status**: Failed (execution reverted)
- **Gas Used**: 27,390 (very low - indicates early failure)
- **Block**: 53086193
- **From**: `0x85A4b09fb0788f1C549a68dC2EdAe3F97aeb5Dd7`
- **To**: `0x5530975fDe062FE6706298fF3945E3d1a17A310a` (DripCore contract)
- **Stream ID**: 18
- **Recipient**: `0x85A4b09fb0788f1C549a68dC2EdAe3F97aeb5Dd7`

## Diagnosis Results

All pre-flight checks **PASS**:
- ✅ Recipient is in the stream
- ✅ msg.sender == recipient
- ✅ Stream status is Active (allows withdrawal)
- ✅ Recipient has available balance (0.161111 CELO at transaction block)
- ✅ Contract has sufficient balance (157+ CELO)

## Root Cause Analysis

The transaction failed with only **27,390 gas used**, which indicates it failed on one of the early `require` statements in `withdrawFromStream`:

```solidity
function withdrawFromStream(uint256 streamId, address recipient) external nonReentrant returns (uint256 withdrawn) {
    Stream storage stream = _streams[streamId];
    require(stream.streamId != 0, "DripCore: Stream does not exist");           // ~2,100 gas
    require(stream.status == StreamStatus.Active || ..., "DripCore: ...");      // ~2,100 gas
    require(_isRecipient(stream, recipient), "DripCore: Not a recipient");      // ~2,100 gas
    require(msg.sender == recipient, "DripCore: Only recipient can withdraw");    // ~2,100 gas
    
    uint256 availableBalance = this.getRecipientBalance(streamId, recipient);    // External call
    require(availableBalance > 0, "DripCore: No balance available");
    // ...
}
```

### Potential Issues

1. **External Call to `getRecipientBalance`**: 
   - Line 375 uses `this.getRecipientBalance()` which makes an external call
   - This is inefficient and could potentially fail if there's a gas issue
   - The function should use an internal version instead

2. **Reentrancy Guard**:
   - The function has `nonReentrant` modifier
   - If the guard is already set (unlikely but possible), it would revert immediately
   - Gas cost: ~20,000 gas for first check

3. **Storage Read Issues**:
   - The low gas usage (27,390) suggests it failed before the external call
   - This points to one of the early require statements

## Most Likely Cause

Given that:
- All our checks pass
- Gas used is very low (27,390)
- The transaction was included in a block but failed

The most likely cause is that **the external call to `getRecipientBalance` is failing** or there's an issue with how the balance is calculated at the exact moment of execution.

However, since we can successfully call `getRecipientBalance` from our script, the issue might be:
1. **Gas limit issue** - The external call might be consuming too much gas in the context of the transaction
2. **State inconsistency** - The balance calculation might be different when called from within the contract vs externally
3. **Timing issue** - The balance might have changed between when the UI checked it and when the transaction executed

## Recommended Fix

1. **Replace external call with internal function**:
   ```solidity
   // Instead of:
   uint256 availableBalance = this.getRecipientBalance(streamId, recipient);
   
   // Use an internal version:
   uint256 availableBalance = _getRecipientBalanceInternal(streamId, recipient);
   ```

2. **Add better error handling**:
   - Use `try-catch` for the balance calculation
   - Return more descriptive error messages

3. **Add validation before transaction**:
   - Check balance immediately before sending transaction
   - Add a check to ensure contract has sufficient balance

## Immediate Workaround

Users should:
1. Wait a few seconds and try again (balance might have changed)
2. Refresh the page to get the latest balance
3. Check that the stream is still active
4. Ensure they have enough gas

## Next Steps

1. Check if there are other failed withdrawal transactions with similar patterns
2. Review the `getRecipientBalance` function for potential issues
3. Consider refactoring to use an internal balance calculation function
4. Add more detailed error logging to help diagnose future issues






