// Import ABIs from JSON files
import DripCoreABIJson from "./DripCore.abi.json";
import SubscriptionManagerABIJson from "./SubscriptionManager.abi.json";

// Handle different JSON structures:
// - DripCore.abi.json is an array directly: [...]
// - SubscriptionManager.abi.json is an object with abi property: { abi: [...] }
const DripCoreABI = Array.isArray(DripCoreABIJson) 
  ? DripCoreABIJson 
  : (DripCoreABIJson as { abi: readonly unknown[] }).abi;

const SubscriptionManagerABI = Array.isArray(SubscriptionManagerABIJson)
  ? SubscriptionManagerABIJson
  : (SubscriptionManagerABIJson as { abi: readonly unknown[] }).abi;

// Export ABIs for use in contracts (wagmi expects readonly array)
export const DRIP_CORE_ABI = DripCoreABI as readonly unknown[];
export const SUBSCRIPTION_MANAGER_ABI = SubscriptionManagerABI as readonly unknown[];

// Re-export for backward compatibility
export { DripCoreABI, SubscriptionManagerABI };

