// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DripTypes
 * @notice Library containing shared data structures and types for Drip contracts
 * @dev This library centralizes common types used across multiple contracts
 */
library DripTypes {
    /// @notice Supported payment tokens
    enum TokenType {
        Native,  // Native CELO
        ERC20    // ERC20 token (cUSD, USDC, USDT, etc.)
    }

    /// @notice Payment schedule structure for recurring payments
    struct PaymentSchedule {
        uint256 scheduleId;         // Unique identifier for the schedule
        address payer;               // Address making the payments
        address[] recipients;        // Array of recipient addresses
        address token;               // Token address
        uint256[] amounts;           // Amounts per recipient (parallel array to recipients)
        uint256 interval;            // Payment interval in seconds
        uint256 startTime;           // When payments should start
        uint256 endTime;             // When payments should end (0 for indefinite)
        uint256 nextPaymentTime;     // Timestamp of next scheduled payment
        uint256 totalPayments;       // Total number of payments made
        bool active;                 // Whether the schedule is active
    }

    /// @notice Treasury configuration structure
    struct TreasuryConfig {
        address treasuryAddress;      // Treasury wallet address
        address[] authorizedSigners;  // Addresses authorized to manage treasury
        uint256 maxSinglePayment;    // Maximum amount for a single payment
        uint256 dailyLimit;          // Daily spending limit
        uint256 monthlyLimit;        // Monthly spending limit
        bool requiresMultiSig;       // Whether multi-signature is required
        uint256 requiredSignatures;  // Number of signatures required (if multi-sig)
    }

    /// @notice Error codes for better error handling
    enum ErrorCode {
        None,                    // No error
        InvalidRecipient,        // Invalid recipient address
        InvalidAmount,           // Invalid payment amount
        InsufficientBalance,     // Insufficient balance
        StreamNotFound,         // Stream does not exist
        SubscriptionNotFound,    // Subscription does not exist
        StreamNotActive,         // Stream is not active
        SubscriptionNotActive,   // Subscription is not active
        PaymentNotDue,           // Payment is not due yet
        Unauthorized,            // Unauthorized action
        InvalidToken,            // Invalid token address
        InvalidDuration,         // Invalid duration
        InvalidCadence,          // Invalid cadence
        TransferFailed           // Token transfer failed
    }
}

