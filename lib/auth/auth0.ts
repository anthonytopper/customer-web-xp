import { Auth0Client } from '@auth0/nextjs-auth0/server';

// The @auth0/nextjs-auth0 SDK expects these specific environment variable names:
// - AUTH0_SECRET (required for session encryption)
// - AUTH0_BASE_URL (required - your app's base URL)
// - AUTH0_ISSUER_BASE_URL (required - your Auth0 domain, e.g., https://your-tenant.auth0.com)
// - AUTH0_CLIENT_ID (required)
// - AUTH0_CLIENT_SECRET (required - critical for authorization code exchange)
// - AUTH0_AUDIENCE (optional - for API access)

// Export for reference/validation
export const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
export const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;
export const AUTH0_ISSUER = process.env.AUTH0_ISSUER || (AUTH0_DOMAIN ? `https://${AUTH0_DOMAIN}` : undefined);
export const AUTH0_SECRET = process.env.AUTH0_SECRET;
export const AUTH0_BASE_URL = process.env.AUTH0_BASE_URL || process.env.NEXT_PUBLIC_AUTH0_BASE_URL;
export const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
export const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;

// The SDK reads from process.env automatically, but we need to ensure AUTH0_ISSUER_BASE_URL is set
// If AUTH0_ISSUER_BASE_URL is not set, try to construct it from AUTH0_ISSUER or AUTH0_DOMAIN
if (!process.env.AUTH0_ISSUER_BASE_URL) {
  if (process.env.AUTH0_ISSUER) {
    process.env.AUTH0_ISSUER_BASE_URL = process.env.AUTH0_ISSUER;
  } else if (AUTH0_DOMAIN) {
    process.env.AUTH0_ISSUER_BASE_URL = `https://${AUTH0_DOMAIN}`;
  }
}

export const auth0 = new Auth0Client();
