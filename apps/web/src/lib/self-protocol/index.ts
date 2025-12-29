/**
 * Self Protocol Identity Verification Integration
 * 
 * Main export file for Self Protocol SDK integration
 */

// Types
export type {
  SelfVerificationStatus,
  SelfVerificationConfig,
  QRCodeState,
  SelfVerificationResult,
  QRCodeData,
} from "./types";

// Constants
export {
  DEFAULT_SELF_CONFIG,
  SELF_DOCS,
  QR_CODE_EXPIRY_MS,
  SELF_VERIFICATION_SESSION_KEY,
  getSelfConfig,
} from "./constants";

// Utils
export {
  isQRCodeExpired,
  getTimeUntilExpiry,
  createQRCodeExpiry,
  generateSessionId,
  getVerificationErrorMessage,
  storeVerificationSession,
  getVerificationSession,
  clearVerificationSession,
} from "./utils";

// SDK hooks
export { useSelfProtocol } from "./hooks/useSelfProtocol";

