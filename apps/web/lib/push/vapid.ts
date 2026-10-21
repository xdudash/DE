/** Shared shape check for the browser's public VAPID key, used by tests and docs. */
export function looksLikeVapidPublicKey(value: string): boolean {
  // An uncompressed P-256 point is 65 bytes, which is 87 characters in base64url without padding.
  return /^[A-Za-z0-9_-]{87}$/.test(value);
}
