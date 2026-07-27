/** Default session lifetime when "Remember me" is off (24 hours). */
export const AUTH_SESSION_DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24;

/** Extended session when "Remember me" is on (5 days). */
export const AUTH_SESSION_REMEMBER_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

/** Auth.js session cookie names (dev vs secure production). */
export const AUTHJS_SESSION_COOKIE = "authjs.session-token";
export const AUTHJS_SESSION_COOKIE_SECURE = "__Secure-authjs.session-token";

export function getAuthSessionCookieName(secure: boolean): string {
  return secure ? AUTHJS_SESSION_COOKIE_SECURE : AUTHJS_SESSION_COOKIE;
}

export function resolveSessionMaxAgeSeconds(rememberMe: boolean): number {
  return rememberMe
    ? AUTH_SESSION_REMEMBER_MAX_AGE_SECONDS
    : AUTH_SESSION_DEFAULT_MAX_AGE_SECONDS;
}
