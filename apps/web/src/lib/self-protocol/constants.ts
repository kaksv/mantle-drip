/**
 * Constants for Self Protocol identity verification integration
 */

/**
 * Default Self Protocol configuration
 */
export const DEFAULT_SELF_CONFIG = {
  appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || "Drip - Programmable Payments",
  scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "drip-payments",
  // Endpoint must be a full URL for Self Protocol to work
  endpoint: process.env.NEXT_PUBLIC_SELF_ENDPOINT || 
    (typeof window !== 'undefined' 
      ? `${window.location.origin}/api/self/verify`
      : "/api/self/verify"),
  disclosures: {
    date_of_birth: true,
    minimumAge: 18,
  },
} as const;

/**
 * Self Protocol documentation URLs
 */
export const SELF_DOCS = {
  MAIN: "https://docs.self.xyz",
  QUICKSTART: "https://docs.self.xyz/use-self/quickstart",
  BACKEND: "https://docs.self.xyz/use-self/backend-verification",
  FRONTEND: "https://docs.self.xyz/use-self/frontend-integration",
} as const;

/**
 * QR code expiry time (in milliseconds)
 * Default: 5 minutes
 */
export const QR_CODE_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Verification session storage key
 */
export const SELF_VERIFICATION_SESSION_KEY = "self-verification-session";

/**
 * Get Self Protocol configuration
 */
export function getSelfConfig(userId: string): {
  appName: string;
  scope: string;
  endpoint: string;
  userId: string;
  disclosures: {
    date_of_birth: boolean;
    minimumAge: number;
  };
} {
  // Ensure endpoint is a full URL (required by Self Protocol)
  let endpoint = process.env.NEXT_PUBLIC_SELF_ENDPOINT;
  
  // If endpoint is not set or is relative, convert to full URL
  if (!endpoint || endpoint.startsWith('/')) {
    if (typeof window !== 'undefined') {
      // Client-side: use current origin
      endpoint = `${window.location.origin}${endpoint || '/api/self/verify'}`;
    } else {
      // Server-side: use environment variable or default
      const publicUrl = process.env.NEXT_PUBLIC_APP_URL || 
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
        'http://localhost:3000';
      endpoint = `${publicUrl}${endpoint || '/api/self/verify'}`;
    }
  }
  
  // Ensure endpoint is HTTPS in production
  if (process.env.NODE_ENV === 'production' && endpoint.startsWith('http://')) {
    console.warn('Self Protocol endpoint should use HTTPS in production');
  }
  
  return {
    appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || DEFAULT_SELF_CONFIG.appName,
    scope: process.env.NEXT_PUBLIC_SELF_SCOPE || DEFAULT_SELF_CONFIG.scope,
    endpoint,
    userId,
    disclosures: {
      date_of_birth: true,
      minimumAge: 18,
    },
  };
}

