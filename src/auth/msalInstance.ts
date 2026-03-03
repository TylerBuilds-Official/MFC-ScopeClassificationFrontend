/**
 * Singleton MSAL instance — imported by both main.tsx (MsalProvider)
 * and client.ts (token acquisition for API calls).
 */
import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig } from './authConfig'

export const msalInstance = new PublicClientApplication(msalConfig)
