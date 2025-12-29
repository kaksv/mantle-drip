// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IERC20.sol";

/**
 * @title TokenHelper
 * @notice Utility library for handling both native CELO and ERC20 token transfers
 * @dev Provides safe transfer functions that work with both native and ERC20 tokens
 */
library TokenHelper {
    /// @notice Native token address (address(0) represents native CELO)
    address public constant NATIVE_TOKEN = address(0);

    /**
     * @notice Transfers tokens (native or ERC20) to a recipient
     * @param token Token address (address(0) for native CELO)
     * @param to Recipient address
     * @param amount Amount to transfer
     * @return success Whether the transfer was successful
     */
    function safeTransfer(
        address token,
        address to,
        uint256 amount
    ) internal returns (bool success) {
        if (token == NATIVE_TOKEN) {
            // Transfer native CELO
            (success, ) = to.call{value: amount}("");
            require(success, "TokenHelper: Native transfer failed");
        } else {
            // Transfer ERC20 token
            success = IERC20(token).transfer(to, amount);
            require(success, "TokenHelper: ERC20 transfer failed");
        }
        return success;
    }

    /**
     * @notice Transfers tokens from a sender to a recipient (for ERC20 with approval)
     * @param token Token address (must be ERC20, not native)
     * @param from Sender address
     * @param to Recipient address
     * @param amount Amount to transfer
     * @return success Whether the transfer was successful
     */
    function safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 amount
    ) internal returns (bool success) {
        require(token != NATIVE_TOKEN, "TokenHelper: Cannot transferFrom native token");
        require(IERC20(token).transferFrom(from, to, amount), "TokenHelper: ERC20 transferFrom failed");
        return true;
    }

    /**
     * @notice Gets the balance of tokens for an address
     * @param token Token address (address(0) for native CELO)
     * @param account Address to check balance for
     * @return balance The balance of the account
     */
    function getBalance(address token, address account) internal view returns (uint256 balance) {
        if (token == NATIVE_TOKEN) {
            return account.balance;
        } else {
            return IERC20(token).balanceOf(account);
        }
    }

    /**
     * @notice Checks if an address is a valid ERC20 token
     * @param token Token address to check
     * @return isValid Whether the address is a valid ERC20 token
     */
    function isValidToken(address token) internal view returns (bool isValid) {
        if (token == NATIVE_TOKEN) {
            return true; // Native token is always valid
        }
        
        // Try to call balanceOf - if it succeeds, it's likely an ERC20
        (bool success, ) = token.staticcall(
            abi.encodeWithSelector(IERC20.balanceOf.selector, address(this))
        );
        return success;
    }
}

