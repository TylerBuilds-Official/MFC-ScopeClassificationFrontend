import type { Configuration } from '@azure/msal-browser'
import { LogLevel } from '@azure/msal-browser'

const baseUrl = window.location.origin

export const msalConfig: Configuration = {
  auth: {
    clientId:              '79633382-952d-4e11-bd6d-6f047bf5732b',
    authority:             'https://login.microsoftonline.com/99857259-7d6a-47fb-a35b-7f6004c4965d',
    redirectUri:           `${baseUrl}/auth/callback`,
    postLogoutRedirectUri: baseUrl,
  },
  cache: {
    cacheLocation:         'sessionStorage',
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return
        switch (level) {
          case LogLevel.Error:   console.error(message); break
          case LogLevel.Warning: console.warn(message);  break
        }
      },
      logLevel: LogLevel.Warning,
    },
  },
}

export const loginRequest = {
  scopes: ['api://79633382-952d-4e11-bd6d-6f047bf5732b/access_as_user'],
}

export const apiTokenRequest = {
  scopes: ['api://79633382-952d-4e11-bd6d-6f047bf5732b/access_as_user'],
}
