/**
 * Good Dollar UBI Integration
 * 
 * Main export file for Good Dollar SDK integration
 */

// Types
export type {
  GoodDollarEnv,
  IdentityStatus,
  IdentityExpiry,
  ClaimEntitlement,
  WalletClaimStatus,
  WalletClaimStatusType,
  ClaimTransactionState,
  ClaimState,
  FaceVerificationOptions,
} from "./types";

// Constants
export {
  DEFAULT_GOODDOLLAR_ENV,
  SUPPORTED_CHAIN_IDS,
  getGoodDollarEnvForChain,
  GOODDOLLAR_DOCS,
} from "./constants";

// Utils
export {
  formatEntitlement,
  createClaimEntitlement,
  getTimeUntilNextClaim,
  isSupportedChain,
  getErrorMessage,
} from "./utils";

// SDK hooks
export { useIdentitySDK } from "./hooks/useIdentitySDK";
export { useClaimSDK } from "./hooks/useClaimSDK";

