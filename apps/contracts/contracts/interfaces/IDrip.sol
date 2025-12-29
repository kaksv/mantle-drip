// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IDrip
 * @notice Interface for the Drip payment streaming contract
 * @dev Defines the core functionality for creating and managing payment streams
 */
interface IDrip {
    /// @notice Stream status enumeration
    enum StreamStatus {
        Pending,    // Stream created but not started
        Active,     // Stream is active and accruing
        Paused,     // Stream is paused
        Cancelled,  // Stream was cancelled
        Completed   // Stream completed naturally
    }

    /// @notice Stream structure
    struct Stream {
        uint256 streamId;           // Unique identifier for the stream
        address sender;             // Address that created the stream
        address[] recipients;       // Addresses receiving the stream (multiple recipients)
        address token;              // ERC20 token address (address(0) for native CELO)
        uint256 deposit;            // Total amount deposited (remaining is derived)
        uint256 startTime;          // Timestamp when stream starts
        uint256 endTime;            // Timestamp when stream ends (calculated from duration)
        StreamStatus status;         // Current status of the stream
        uint256 rateLockUntil;      // Timestamp until which rate modifications are locked
        string title;               // Optional title (max 120 chars)
        string description;         // Optional description (max 1024 chars)
    }

    /// @notice Recipient information structure
    struct RecipientInfo {
        address recipient;          // Recipient address
        uint256 ratePerSecond;      // Rate per second for this recipient
        uint256 totalWithdrawn;      // Total amount withdrawn by this recipient
        uint256 lastWithdrawTime;   // Last withdrawal timestamp
        uint256 currentAccrued;     // Current accrued amount (not yet withdrawn)
    }

    /// @notice Emitted when a new stream is created
    event StreamCreated(
        uint256 indexed streamId,
        address indexed sender,
        address[] recipients,
        address token,
        uint256 deposit,
        uint256 startTime,
        uint256 endTime,
        string title,
        string description
    );

    /// @notice Emitted when a stream is paused
    event StreamPaused(uint256 indexed streamId, address indexed by);

    /// @notice Emitted when a stream is resumed
    event StreamResumed(uint256 indexed streamId, address indexed by);

    /// @notice Emitted when a stream is cancelled
    event StreamCancelled(
        uint256 indexed streamId,
        address indexed by,
        uint256 refundAmount
    );

    /// @notice Emitted when funds are withdrawn from a stream
    event StreamWithdrawn(
        uint256 indexed streamId,
        address indexed recipient,
        uint256 amount
    );

    /// @notice Emitted when a stream completes naturally
    event StreamCompleted(uint256 indexed streamId);

    /// @notice Emitted when a stream's rate is locked
    event StreamRateLocked(uint256 indexed streamId, uint256 lockUntil);

    /// @notice Emitted when a stream receives additional deposit or extended duration
    event StreamExtended(uint256 indexed streamId, uint256 newEndTime, uint256 addedDeposit);

    /// @notice Emitted when a recipient is added to a stream
    event RecipientAdded(
        uint256 indexed streamId,
        address indexed recipient,
        uint256 amountPerPeriod,
        uint256 ratePerSecond
    );

    /// @notice Emitted when a recipient is removed from a stream
    event RecipientRemoved(
        uint256 indexed streamId,
        address indexed recipient,
        uint256 refundAmount
    );

    /// @notice Emitted when emergency withdrawal is performed
    event EmergencyWithdrawal(
        address indexed token,
        address indexed to,
        uint256 amount
    );

    /**
     * @notice Emergency withdrawal function - withdraw ALL funds from contract (owner only)
     * @param tokens Array of ERC20 token addresses to withdraw (can be empty if only withdrawing native)
     * @param to Address to send all funds to
     */
    function emergencyWithdrawAll(address[] calldata tokens, address payable to) external;

    /**
     * @notice Get contract balances for multiple tokens (view function)
     * @param tokens Array of token addresses to check (use address(0) for native CELO)
     * @return balances Array of balances corresponding to the tokens array
     */
    function getContractBalances(address[] calldata tokens) external view returns (uint256[] memory balances);

    /// @notice Emitted when a recipient's rate is updated
    event RecipientRateUpdated(
        uint256 indexed streamId,
        address indexed recipient,
        uint256 oldRatePerSecond,
        uint256 newRatePerSecond
    );

    /**
     * @notice Create a new payment stream with multiple recipients
     * @param recipients Array of addresses that will receive the streamed payments
     * @param token ERC20 token address (address(0) for native CELO)
     * @param amountsPerPeriod Array of amounts per period for each recipient (parallel to recipients)
     * @param periodSeconds Duration of the period in seconds (e.g., 30 days)
     * @param deposit Total amount to deposit (must cover all recipients)
     * @param title Optional title for the stream (max 120 chars)
     * @param description Optional description (max 1024 chars)
     * @return streamId Unique identifier for the created stream
     */
    function createStream(
        address[] calldata recipients,
        address token,
        uint256[] calldata amountsPerPeriod,
        uint256 periodSeconds,
        uint256 deposit,
        string calldata title,
        string calldata description
    ) external payable returns (uint256 streamId);

    /**
     * @notice Get the current balance available for withdrawal for a specific recipient
     * @param streamId The stream identifier
     * @param recipient The recipient address
     * @return balance The amount available for withdrawal
     */
    function getRecipientBalance(uint256 streamId, address recipient) external view returns (uint256 balance);

    /**
     * @notice Withdraw available balance from a stream (for a specific recipient)
     * @param streamId The stream identifier
     * @param recipient The recipient address withdrawing
     * @return withdrawn The amount actually withdrawn (always the full available balance)
     */
    function withdrawFromStream(uint256 streamId, address recipient) external returns (uint256 withdrawn);

    /**
     * @notice Get detailed information about a specific recipient in a stream
     * @param streamId The stream identifier
     * @param recipient The recipient address
     * @return info Recipient information structure
     */
    function getRecipientInfo(uint256 streamId, address recipient) external view returns (RecipientInfo memory info);

    /**
     * @notice Get information about all recipients in a stream
     * @param streamId The stream identifier
     * @return recipients Array of recipient information
     */
    function getAllRecipientsInfo(uint256 streamId) external view returns (RecipientInfo[] memory recipients);

    /**
     * @notice Pause an active stream
     * @param streamId The stream identifier
     */
    function pauseStream(uint256 streamId) external;

    /**
     * @notice Resume a paused stream
     * @param streamId The stream identifier
     */
    function resumeStream(uint256 streamId) external;

    /**
     * @notice Cancel a stream and refund remaining balance
     * @param streamId The stream identifier
     */
    function cancelStream(uint256 streamId) external;

    /**
     * @notice Lock rate-related modifications for a stream
     * @param streamId The stream identifier
     * @param lockDuration Duration (in seconds) to lock rate changes
     */
    function lockStreamRate(uint256 streamId, uint256 lockDuration) external;

    /**
     * @notice Extend a stream's duration and/or add additional deposit
     * @param streamId The stream identifier
     * @param newEndTime The new end time (0 to keep current end time)
     * @param depositAmount Total additional deposit to add (before fees)
     */
    function extendStream(
        uint256 streamId,
        uint256 newEndTime,
        uint256 depositAmount
    ) external payable;

    /**
     * @notice Add a new recipient to an existing stream
     * @param streamId The stream identifier
     * @param recipient The new recipient address
     * @param amountPerPeriod The amount per period for the new recipient
     * @param additionalDeposit Additional deposit required to cover the new recipient
     */
    function addRecipient(
        uint256 streamId,
        address recipient,
        uint256 amountPerPeriod,
        uint256 additionalDeposit
    ) external payable;

    /**
     * @notice Remove a recipient from an existing stream
     * @param streamId The stream identifier
     * @param recipient The recipient address to remove
     * @dev Refunds any unaccrued deposit allocated to this recipient
     */
    function removeRecipient(uint256 streamId, address recipient) external;

    /**
     * @notice Update a recipient's rate in an existing stream
     * @param streamId The stream identifier
     * @param recipient The recipient address
     * @param newAmountPerPeriod The new amount per period
     * @param additionalDeposit Additional deposit if increasing rate, or refund if decreasing
     */
    function updateRecipientRate(
        uint256 streamId,
        address recipient,
        uint256 newAmountPerPeriod,
        uint256 additionalDeposit
    ) external payable;

    /**
     * @notice Get stream details
     * @param streamId The stream identifier
     * @return stream The stream structure
     */
    function getStream(uint256 streamId) external view returns (Stream memory stream);
}

