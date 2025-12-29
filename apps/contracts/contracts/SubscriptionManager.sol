// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ISubscription.sol";
import "./interfaces/IDrip.sol";
import "./interfaces/IERC20.sol";
import "./utils/TokenHelper.sol";

/**
 * @title SubscriptionManager
 * @notice Contract for managing recurring subscription payments with escrow model
 * @dev Handles subscription creation, escrow deposits, automatic payment execution with backlog handling
 */
contract SubscriptionManager is ISubscription, ReentrancyGuard, Ownable {
    using TokenHelper for address;

    /// @notice Reference to DripCore contract for payment delivery
    IDrip public dripCore;

    /// @notice Counter for generating unique subscription IDs
    uint256 private _subscriptionIdCounter;

    /// @notice Counter for generating unique payment IDs
    uint256 private _paymentIdCounter;

    /// @notice Mapping from subscription ID to subscription data
    mapping(uint256 => Subscription) private _subscriptions;

    /// @notice Mapping from subscription ID to array of payment records
    mapping(uint256 => PaymentRecord[]) private _paymentHistory;

    /// @notice Mapping from subscriber address to array of subscription IDs
    mapping(address => uint256[]) private _subscriberSubscriptions;

    /// @notice Mapping from recipient address to array of subscription IDs
    mapping(address => uint256[]) private _recipientSubscriptions;

    /// @notice Platform fee percentage (basis points)
    uint256 public platformFeeBps = 50; // 0.5% default

    /// @notice Platform fee recipient
    address public platformFeeRecipient;

    /// @notice Minimum subscription amount
    uint256 public constant MIN_AMOUNT = 1e15; // 0.001 tokens (assuming 18 decimals)

    /// @notice Maximum subscription amount
    uint256 public constant MAX_AMOUNT = 1e30; // Very large limit

    /// @notice Maximum title length
    uint256 public constant MAX_TITLE_LEN = 120;

    /// @notice Maximum description length
    uint256 public constant MAX_DESCRIPTION_LEN = 1024;

    /**
     * @notice Constructor
     * @param _dripCore Address of the DripCore contract
     * @param _platformFeeRecipient Address to receive platform fees
     */
    constructor(address _dripCore, address _platformFeeRecipient) Ownable(msg.sender) {
        require(_dripCore != address(0), "SubscriptionManager: Invalid DripCore address");
        require(_platformFeeRecipient != address(0), "SubscriptionManager: Invalid fee recipient");
        dripCore = IDrip(_dripCore);
        platformFeeRecipient = _platformFeeRecipient;
    }

    /**
     * @notice Create a new subscription (escrow model - balance starts at 0)
     * @param recipient Address that will receive the subscription payments
     * @param token ERC20 token address (address(0) for native CELO)
     * @param amount Amount per payment
     * @param cadence Payment cadence (Daily, Weekly, Monthly, or Custom)
     * @param customInterval Custom interval in seconds (only used if cadence is Custom)
     * @param firstPaymentTime Timestamp for first payment (0 for now + interval)
     * @param title Optional title (max 120 chars)
     * @param description Optional description (max 1024 chars)
     * @return subscriptionId Unique identifier for the created subscription
     */
    function createSubscription(
        address recipient,
        address token,
        uint256 amount,
        Cadence cadence,
        uint256 customInterval,
        uint256 firstPaymentTime,
        string calldata title,
        string calldata description
    ) external payable nonReentrant returns (uint256 subscriptionId) {
        require(recipient != address(0), "SubscriptionManager: Invalid recipient");
        require(recipient != msg.sender, "SubscriptionManager: Cannot subscribe to self");
        require(amount >= MIN_AMOUNT, "SubscriptionManager: Amount too small");
        require(amount <= MAX_AMOUNT, "SubscriptionManager: Amount too large");
        require(bytes(title).length <= MAX_TITLE_LEN, "SubscriptionManager: Title too long");
        require(bytes(description).length <= MAX_DESCRIPTION_LEN, "SubscriptionManager: Description too long");

        uint256 interval = _getInterval(cadence, customInterval);
        require(interval > 0, "SubscriptionManager: Invalid interval");

        // Calculate platform fee
        uint256 fee = (amount * platformFeeBps) / 10000;
        uint256 paymentAmount = amount - fee;

        // Create subscription
        subscriptionId = ++_subscriptionIdCounter;
        uint256 nextPaymentTime = firstPaymentTime > 0 ? firstPaymentTime : block.timestamp + interval;

        _subscriptions[subscriptionId] = Subscription({
            subscriptionId: subscriptionId,
            subscriber: msg.sender,
            recipient: recipient,
            token: token,
            amount: paymentAmount,
            cadence: cadence,
            interval: interval,
            nextPaymentTime: nextPaymentTime,
            lastPaymentTime: 0,
            totalPaid: 0,
            paymentCount: 0,
            balance: 0, // Start with zero balance - subscriber must deposit
            status: SubscriptionStatus.Active,
            title: title,
            description: description
        });

        // Update mappings
        _subscriberSubscriptions[msg.sender].push(subscriptionId);
        _recipientSubscriptions[recipient].push(subscriptionId);

        emit SubscriptionCreated(
            subscriptionId,
            msg.sender,
            recipient,
            token,
            paymentAmount,
            cadence,
            nextPaymentTime,
            title,
            description
        );

        return subscriptionId;
    }

    /**
     * @notice Deposit funds to a subscription (escrow model)
     * @dev Dynamically supports both native CELO and ERC20 tokens
     * @param subscriptionId The subscription identifier
     * @param amount Amount to deposit (for native: use msg.value, amount should be 0 or match msg.value)
     */
    function depositToSubscription(uint256 subscriptionId, uint256 amount) external payable nonReentrant {
        Subscription storage subscription = _subscriptions[subscriptionId];
        require(subscription.subscriptionId != 0, "SubscriptionManager: Subscription does not exist");
        require(subscription.subscriber == msg.sender, "SubscriptionManager: Only subscriber can deposit");
        require(
            subscription.status == SubscriptionStatus.Active || subscription.status == SubscriptionStatus.Paused,
            "SubscriptionManager: Subscription not active"
        );

        uint256 depositAmount;

        if (subscription.token == TokenHelper.NATIVE_TOKEN) {
            // Native CELO deposit
            require(msg.value > 0, "SubscriptionManager: No native tokens sent");
            if (amount > 0) {
                require(amount == msg.value, "SubscriptionManager: Amount mismatch with msg.value");
                depositAmount = amount;
            } else {
                depositAmount = msg.value;
            }
            // Native tokens are already in contract via msg.value
            subscription.balance += depositAmount;
        } else {
            // ERC20 token deposit (cUSD, USDC, USDT, etc.)
            require(msg.value == 0, "SubscriptionManager: Native token not expected for ERC20 subscription");
            require(amount > 0, "SubscriptionManager: Invalid deposit amount");
            depositAmount = amount;
            
            // Transfer tokens from subscriber to contract (escrow)
            require(
                TokenHelper.safeTransferFrom(subscription.token, msg.sender, address(this), depositAmount),
                "SubscriptionManager: Token transfer failed"
            );
            subscription.balance += depositAmount;
        }

        emit SubscriptionDeposited(subscriptionId, msg.sender, depositAmount, subscription.balance);
    }

    /**
     * @notice Execute a subscription payment (handles backlog automatically)
     * @param subscriptionId The subscription identifier
     * @return success Whether the payment was successful
     * @return paymentId The payment record identifier
     * @return intervalsPaid Number of intervals paid (handles backlog)
     */
    function executePayment(
        uint256 subscriptionId
    ) external nonReentrant returns (bool success, uint256 paymentId, uint256 intervalsPaid) {
        Subscription storage subscription = _subscriptions[subscriptionId];
        require(subscription.subscriptionId != 0, "SubscriptionManager: Subscription does not exist");
        require(subscription.status == SubscriptionStatus.Active, "SubscriptionManager: Subscription not active");
        require(block.timestamp >= subscription.nextPaymentTime, "SubscriptionManager: Payment not due");

        // Determine how many intervals are due (handle backlog)
        intervalsPaid = 1;
        if (block.timestamp >= subscription.nextPaymentTime + subscription.interval) {
            intervalsPaid = ((block.timestamp - subscription.nextPaymentTime) / subscription.interval) + 1;
        }

        // Calculate total amount to transfer (including fees)
        uint256 feePerInterval = (subscription.amount * platformFeeBps) / 10000;
        uint256 paymentAmountPerInterval = subscription.amount - feePerInterval;
        uint256 totalPaymentAmount = paymentAmountPerInterval * intervalsPaid;
        uint256 totalFee = feePerInterval * intervalsPaid;
        uint256 totalRequired = totalPaymentAmount + totalFee;

        // Check subscription balance (escrow model)
        require(subscription.balance >= totalRequired, "SubscriptionManager: Insufficient balance");

        // Transfer payment from contract to recipient (dynamic token support)
        bool transferSuccess = false;
        if (subscription.token == TokenHelper.NATIVE_TOKEN) {
            // Native CELO transfer
            require(address(this).balance >= totalRequired, "SubscriptionManager: Insufficient contract balance");
            (bool successTransfer, ) = subscription.recipient.call{value: totalPaymentAmount}("");
            transferSuccess = successTransfer;
            
            // Transfer fee to platform
            if (totalFee > 0 && successTransfer) {
                (bool feeSuccess, ) = platformFeeRecipient.call{value: totalFee}("");
                require(feeSuccess, "SubscriptionManager: Fee transfer failed");
            }
        } else {
            // ERC20 token transfer (cUSD, USDC, USDT, etc.)
            uint256 contractBalance = TokenHelper.getBalance(subscription.token, address(this));
            require(contractBalance >= totalRequired, "SubscriptionManager: Insufficient contract balance");
            
            // Transfer from contract to recipient
            transferSuccess = TokenHelper.safeTransfer(subscription.token, subscription.recipient, totalPaymentAmount);
            
            // Transfer fee to platform
            if (totalFee > 0 && transferSuccess) {
                require(
                    TokenHelper.safeTransfer(subscription.token, platformFeeRecipient, totalFee),
                    "SubscriptionManager: Fee transfer failed"
                );
            }
        }

        if (transferSuccess) {
            // Update subscription
            subscription.lastPaymentTime = block.timestamp;
            subscription.nextPaymentTime = subscription.nextPaymentTime + (intervalsPaid * subscription.interval);
            subscription.totalPaid += totalPaymentAmount;
            subscription.paymentCount += intervalsPaid;
            subscription.balance -= totalRequired; // Deduct from escrow

            // Record payment
            paymentId = ++_paymentIdCounter;
            _paymentHistory[subscriptionId].push(
                PaymentRecord({
                    paymentId: paymentId,
                    subscriptionId: subscriptionId,
                    amount: totalPaymentAmount,
                    timestamp: block.timestamp,
                    success: true
                })
            );

            emit PaymentExecuted(subscriptionId, paymentId, subscription.recipient, totalPaymentAmount, block.timestamp);
            return (true, paymentId, intervalsPaid);
        } else {
            // Record failed payment
            paymentId = ++_paymentIdCounter;
            _paymentHistory[subscriptionId].push(
                PaymentRecord({
                    paymentId: paymentId,
                    subscriptionId: subscriptionId,
                    amount: totalPaymentAmount,
                    timestamp: block.timestamp,
                    success: false
                })
            );
            return (false, paymentId, 0);
        }
    }

    /**
     * @notice Execute multiple subscription payments in batch
     * @param subscriptionIds Array of subscription identifiers
     * @return successCount Number of successful payments
     */
    function executeBatchPayments(
        uint256[] calldata subscriptionIds
    ) external returns (uint256 successCount) {
        successCount = 0;
        for (uint256 i = 0; i < subscriptionIds.length; i++) {
            // Call executePayment internally (not via this.executePayment to avoid reentrancy guard conflict)
            Subscription storage subscription = _subscriptions[subscriptionIds[i]];
            if (subscription.subscriptionId == 0 || subscription.status != SubscriptionStatus.Active) {
                continue;
            }
            if (block.timestamp < subscription.nextPaymentTime) {
                continue;
            }

            // Determine how many intervals are due
            uint256 intervalsPaid = 1;
            if (block.timestamp >= subscription.nextPaymentTime + subscription.interval) {
                intervalsPaid = ((block.timestamp - subscription.nextPaymentTime) / subscription.interval) + 1;
            }

            // Calculate amounts
            uint256 feePerInterval = (subscription.amount * platformFeeBps) / 10000;
            uint256 paymentAmountPerInterval = subscription.amount - feePerInterval;
            uint256 totalPaymentAmount = paymentAmountPerInterval * intervalsPaid;
            uint256 totalFee = feePerInterval * intervalsPaid;
            uint256 totalRequired = totalPaymentAmount + totalFee;

            // Check balance
            if (subscription.balance < totalRequired) {
                continue;
            }

            // Transfer payment
            bool transferSuccess = false;
            if (subscription.token == TokenHelper.NATIVE_TOKEN) {
                require(address(this).balance >= totalRequired, "SubscriptionManager: Insufficient contract balance");
                (bool successTransfer, ) = subscription.recipient.call{value: totalPaymentAmount}("");
                transferSuccess = successTransfer;
                
                if (totalFee > 0 && successTransfer) {
                    (bool feeSuccess, ) = platformFeeRecipient.call{value: totalFee}("");
                    require(feeSuccess, "SubscriptionManager: Fee transfer failed");
                }
            } else {
                uint256 contractBalance = TokenHelper.getBalance(subscription.token, address(this));
                require(contractBalance >= totalRequired, "SubscriptionManager: Insufficient contract balance");
                
                transferSuccess = TokenHelper.safeTransfer(subscription.token, subscription.recipient, totalPaymentAmount);
                
                if (totalFee > 0 && transferSuccess) {
                    require(
                        TokenHelper.safeTransfer(subscription.token, platformFeeRecipient, totalFee),
                        "SubscriptionManager: Fee transfer failed"
                    );
                }
            }

            if (transferSuccess) {
                // Update subscription
                subscription.lastPaymentTime = block.timestamp;
                subscription.nextPaymentTime = subscription.nextPaymentTime + (intervalsPaid * subscription.interval);
                subscription.totalPaid += totalPaymentAmount;
                subscription.paymentCount += intervalsPaid;
                subscription.balance -= totalRequired;

                // Record payment
                uint256 paymentId = ++_paymentIdCounter;
                _paymentHistory[subscriptionIds[i]].push(
                    PaymentRecord({
                        paymentId: paymentId,
                        subscriptionId: subscriptionIds[i],
                        amount: totalPaymentAmount,
                        timestamp: block.timestamp,
                        success: true
                    })
                );

                emit PaymentExecuted(subscriptionIds[i], paymentId, subscription.recipient, totalPaymentAmount, block.timestamp);
                successCount++;
            }
        }
        return successCount;
    }

    /**
     * @notice Pause an active subscription
     * @param subscriptionId The subscription identifier
     */
    function pauseSubscription(uint256 subscriptionId) external {
        Subscription storage subscription = _subscriptions[subscriptionId];
        require(subscription.subscriptionId != 0, "SubscriptionManager: Subscription does not exist");
        require(subscription.status == SubscriptionStatus.Active, "SubscriptionManager: Subscription not active");
        require(
            msg.sender == subscription.subscriber || msg.sender == owner(),
            "SubscriptionManager: Unauthorized"
        );

        subscription.status = SubscriptionStatus.Paused;
        emit SubscriptionPaused(subscriptionId, msg.sender);
    }

    /**
     * @notice Resume a paused subscription
     * @param subscriptionId The subscription identifier
     */
    function resumeSubscription(uint256 subscriptionId) external {
        Subscription storage subscription = _subscriptions[subscriptionId];
        require(subscription.subscriptionId != 0, "SubscriptionManager: Subscription does not exist");
        require(subscription.status == SubscriptionStatus.Paused, "SubscriptionManager: Subscription not paused");
        require(
            msg.sender == subscription.subscriber || msg.sender == owner(),
            "SubscriptionManager: Unauthorized"
        );

        subscription.status = SubscriptionStatus.Active;
        emit SubscriptionResumed(subscriptionId, msg.sender);
    }

    /**
     * @notice Cancel a subscription (refunds remaining balance)
     * @param subscriptionId The subscription identifier
     */
    function cancelSubscription(uint256 subscriptionId) external nonReentrant {
        Subscription storage subscription = _subscriptions[subscriptionId];
        require(subscription.subscriptionId != 0, "SubscriptionManager: Subscription does not exist");
        require(
            subscription.status == SubscriptionStatus.Active || subscription.status == SubscriptionStatus.Paused,
            "SubscriptionManager: Subscription cannot be cancelled"
        );
        require(
            msg.sender == subscription.subscriber || msg.sender == owner(),
            "SubscriptionManager: Unauthorized"
        );

        uint256 refundAmount = subscription.balance;
        subscription.status = SubscriptionStatus.Cancelled;
        subscription.balance = 0;

        // Refund remaining balance to subscriber (dynamic token support)
        if (refundAmount > 0) {
            if (subscription.token == TokenHelper.NATIVE_TOKEN) {
                // Native CELO refund
                require(address(this).balance >= refundAmount, "SubscriptionManager: Insufficient contract balance");
                (bool success, ) = subscription.subscriber.call{value: refundAmount}("");
                require(success, "SubscriptionManager: Refund failed");
            } else {
                // ERC20 token refund (cUSD, USDC, USDT, etc.)
                require(
                    TokenHelper.safeTransfer(subscription.token, subscription.subscriber, refundAmount),
                    "SubscriptionManager: Refund failed"
                );
            }
        }

        emit SubscriptionCancelled(subscriptionId, msg.sender);
    }

    /**
     * @notice Modify an existing subscription
     * @param subscriptionId The subscription identifier
     * @param newAmount New payment amount
     * @param newCadence New payment cadence
     * @param newInterval New custom interval (only used if cadence is Custom)
     */
    function modifySubscription(
        uint256 subscriptionId,
        uint256 newAmount,
        Cadence newCadence,
        uint256 newInterval
    ) external {
        Subscription storage subscription = _subscriptions[subscriptionId];
        require(subscription.subscriptionId != 0, "SubscriptionManager: Subscription does not exist");
        require(
            subscription.status == SubscriptionStatus.Active || subscription.status == SubscriptionStatus.Paused,
            "SubscriptionManager: Subscription cannot be modified"
        );
        require(
            msg.sender == subscription.subscriber || msg.sender == owner(),
            "SubscriptionManager: Unauthorized"
        );
        require(newAmount >= MIN_AMOUNT, "SubscriptionManager: Amount too small");
        require(newAmount <= MAX_AMOUNT, "SubscriptionManager: Amount too large");

        uint256 interval = _getInterval(newCadence, newInterval);
        require(interval > 0, "SubscriptionManager: Invalid interval");

        subscription.amount = newAmount;
        subscription.cadence = newCadence;
        subscription.interval = interval;

        emit SubscriptionModified(subscriptionId, newAmount, newCadence, interval);
    }

    /**
     * @notice Get subscription details
     * @param subscriptionId The subscription identifier
     * @return subscription The subscription structure
     */
    function getSubscription(
        uint256 subscriptionId
    ) external view returns (Subscription memory subscription) {
        subscription = _subscriptions[subscriptionId];
        require(subscription.subscriptionId != 0, "SubscriptionManager: Subscription does not exist");
        return subscription;
    }

    /**
     * @notice Get payment history for a subscription
     * @param subscriptionId The subscription identifier
     * @param offset Starting index for pagination
     * @param limit Maximum number of records to return
     * @return payments Array of payment records
     * @return total Total number of payments
     */
    function getPaymentHistory(
        uint256 subscriptionId,
        uint256 offset,
        uint256 limit
    ) external view returns (PaymentRecord[] memory payments, uint256 total) {
        require(_subscriptions[subscriptionId].subscriptionId != 0, "SubscriptionManager: Subscription does not exist");
        
        PaymentRecord[] memory allPayments = _paymentHistory[subscriptionId];
        total = allPayments.length;

        if (offset >= total) {
            return (new PaymentRecord[](0), total);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 resultLength = end - offset;
        payments = new PaymentRecord[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            payments[i] = allPayments[offset + i];
        }

        return (payments, total);
    }

    /**
     * @notice Check if a subscription payment is due
     * @param subscriptionId The subscription identifier
     * @return isDue Whether payment is due
     * @return nextPaymentTime Timestamp of next payment
     */
    function isPaymentDue(
        uint256 subscriptionId
    ) external view returns (bool isDue, uint256 nextPaymentTime) {
        Subscription memory subscription = _subscriptions[subscriptionId];
        require(subscription.subscriptionId != 0, "SubscriptionManager: Subscription does not exist");
        
        nextPaymentTime = subscription.nextPaymentTime;
        isDue = subscription.status == SubscriptionStatus.Active && block.timestamp >= nextPaymentTime;
        
        return (isDue, nextPaymentTime);
    }

    /**
     * @notice Get the escrow balance for a subscription
     * @dev Returns the isolated balance held in escrow for this subscription
     * @param subscriptionId The subscription identifier
     * @return balance The escrow balance (works for both native CELO and ERC20 tokens)
     */
    function getSubscriptionBalance(uint256 subscriptionId) external view returns (uint256 balance) {
        Subscription memory subscription = _subscriptions[subscriptionId];
        require(subscription.subscriptionId != 0, "SubscriptionManager: Subscription does not exist");
        return subscription.balance;
    }

    /**
     * @notice Get the contract's total balance for a specific token
     * @dev Useful for checking contract's total escrow for a token type
     * @param token Token address (address(0) for native CELO)
     * @return balance The contract's balance for the token
     */
    function getContractBalance(address token) external view returns (uint256 balance) {
        return TokenHelper.getBalance(token, address(this));
    }

    /**
     * @notice Get all subscription IDs for a subscriber
     * @param subscriber The subscriber address
     * @return subscriptionIds Array of subscription IDs
     */
    function getSubscriberSubscriptions(
        address subscriber
    ) external view returns (uint256[] memory subscriptionIds) {
        return _subscriberSubscriptions[subscriber];
    }

    /**
     * @notice Get all subscription IDs for a recipient
     * @param recipient The recipient address
     * @return subscriptionIds Array of subscription IDs
     */
    function getRecipientSubscriptions(
        address recipient
    ) external view returns (uint256[] memory subscriptionIds) {
        return _recipientSubscriptions[recipient];
    }

    /**
     * @notice Get all subscriptions where user is subscriber
     * @param user The user address
     * @return subscriptions Array of subscription structures
     */
    function getUserSubscriptions(address user) external view returns (Subscription[] memory subscriptions) {
        uint256[] memory subscriptionIds = _subscriberSubscriptions[user];
        subscriptions = new Subscription[](subscriptionIds.length);
        for (uint256 i = 0; i < subscriptionIds.length; i++) {
            subscriptions[i] = _subscriptions[subscriptionIds[i]];
        }
        return subscriptions;
    }

    /**
     * @notice Get all subscriptions where user is recipient
     * @param user The user address
     * @return subscriptions Array of subscription structures
     */
    function getUserReceivedSubscriptions(address user) external view returns (Subscription[] memory subscriptions) {
        uint256[] memory subscriptionIds = _recipientSubscriptions[user];
        subscriptions = new Subscription[](subscriptionIds.length);
        for (uint256 i = 0; i < subscriptionIds.length; i++) {
            subscriptions[i] = _subscriptions[subscriptionIds[i]];
        }
        return subscriptions;
    }

    /**
     * @notice Get all subscriptions where user is either subscriber or recipient
     * @param user The user address
     * @return subscriptions Array of subscription structures
     */
    function getUserSubscriptionsAll(address user) external view returns (Subscription[] memory subscriptions) {
        uint256[] memory subscriberIds = _subscriberSubscriptions[user];
        uint256[] memory recipientIds = _recipientSubscriptions[user];
        
        // Simple approach: combine arrays and filter duplicates in a loop
        uint256 totalLength = subscriberIds.length + recipientIds.length;
        uint256[] memory allIds = new uint256[](totalLength);
        uint256 uniqueCount = 0;
        
        // Add subscriber IDs
        for (uint256 i = 0; i < subscriberIds.length; i++) {
            bool found = false;
            for (uint256 j = 0; j < uniqueCount; j++) {
                if (allIds[j] == subscriberIds[i]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                allIds[uniqueCount++] = subscriberIds[i];
            }
        }
        
        // Add recipient IDs (checking for duplicates)
        for (uint256 i = 0; i < recipientIds.length; i++) {
            bool found = false;
            for (uint256 j = 0; j < uniqueCount; j++) {
                if (allIds[j] == recipientIds[i]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                allIds[uniqueCount++] = recipientIds[i];
            }
        }
        
        // Build result array
        subscriptions = new Subscription[](uniqueCount);
        for (uint256 i = 0; i < uniqueCount; i++) {
            subscriptions[i] = _subscriptions[allIds[i]];
        }
        
        return subscriptions;
    }

    /**
     * @notice Update platform fee (owner only)
     * @param newFeeBps New fee in basis points
     */
    function setPlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "SubscriptionManager: Fee too high"); // Max 10%
        platformFeeBps = newFeeBps;
    }

    /**
     * @notice Update platform fee recipient (owner only)
     * @param newRecipient New fee recipient address
     */
    function setPlatformFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "SubscriptionManager: Invalid recipient");
        platformFeeRecipient = newRecipient;
    }

    /**
     * @notice Internal function to get interval from cadence
     * @param cadence Payment cadence
     * @param customInterval Custom interval (if cadence is Custom)
     * @return interval Interval in seconds
     */
    function _getInterval(Cadence cadence, uint256 customInterval) internal pure returns (uint256 interval) {
        if (cadence == Cadence.Daily) {
            return 1 days;
        } else if (cadence == Cadence.Weekly) {
            return 7 days;
        } else if (cadence == Cadence.Monthly) {
            return 30 days;
        } else if (cadence == Cadence.Custom) {
            require(customInterval >= 1 days, "SubscriptionManager: Custom interval too short");
            require(customInterval <= 365 days, "SubscriptionManager: Custom interval too long");
            return customInterval;
        } else {
            revert("SubscriptionManager: Invalid cadence");
        }
    }

    /**
     * @notice Receive native CELO
     */
    receive() external payable {
        // Allow contract to receive native CELO for escrow deposits
    }
}
