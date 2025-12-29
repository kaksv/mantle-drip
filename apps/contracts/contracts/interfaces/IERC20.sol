// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IERC20
 * @notice Minimal ERC20 interface for token interactions
 * @dev This interface includes only the functions needed for Drip
 */
interface IERC20 {
    /**
     * @notice Returns the total supply of tokens
     * @return The total supply
     */
    function totalSupply() external view returns (uint256);

    /**
     * @notice Returns the balance of the specified address
     * @param account The address to query
     * @return The balance
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @notice Transfers tokens to a specified address
     * @param to The address to transfer to
     * @param amount The amount to transfer
     * @return success Whether the transfer was successful
     */
    function transfer(address to, uint256 amount) external returns (bool success);

    /**
     * @notice Returns the remaining number of tokens that spender will be allowed to spend
     * @param owner The address that owns the tokens
     * @param spender The address that will spend the tokens
     * @return The remaining allowance
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @notice Approves a spender to transfer tokens on behalf of the owner
     * @param spender The address that will spend the tokens
     * @param amount The amount to approve
     * @return success Whether the approval was successful
     */
    function approve(address spender, uint256 amount) external returns (bool success);

    /**
     * @notice Transfers tokens from one address to another
     * @param from The address to transfer from
     * @param to The address to transfer to
     * @param amount The amount to transfer
     * @return success Whether the transfer was successful
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool success);

    /**
     * @notice Emitted when tokens are transferred
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @notice Emitted when an approval is made
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

