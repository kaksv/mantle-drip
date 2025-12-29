import { ethers } from "hardhat";
import { Signer } from "ethers";

/**
 * @title Test Helpers
 * @notice Utility functions for testing Drip contracts
 * @dev Provides common helper functions used across test files
 */
export class TestHelpers {
  /**
   * @notice Get test accounts
   * @returns Object containing test signers
   */
  static async getTestAccounts() {
    const [deployer, sender, recipient, treasury] = await ethers.getSigners();
    return { deployer, sender, recipient, treasury };
  }

  /**
   * @notice Increase time by specified seconds
   * @param seconds Number of seconds to advance
   */
  static async increaseTime(seconds: number) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
  }

  /**
   * @notice Get current block timestamp
   * @returns Current block timestamp
   */
  static async getCurrentTime(): Promise<number> {
    const block = await ethers.provider.getBlock("latest");
    return block?.timestamp || 0;
  }

  /**
   * @notice Get balance of an address (native CELO)
   * @param address Address to check
   * @returns Balance in wei
   */
  static async getBalance(address: string): Promise<bigint> {
    return await ethers.provider.getBalance(address);
  }

  /**
   * @notice Convert ether to wei
   * @param amount Amount in ether
   * @returns Amount in wei
   */
  static parseEther(amount: string): bigint {
    return ethers.parseEther(amount);
  }

  /**
   * @notice Convert wei to ether
   * @param amount Amount in wei
   * @returns Amount in ether
   */
  static formatEther(amount: bigint): string {
    return ethers.formatEther(amount);
  }
}

