const revokedTokens = new Set();

/**
 * Marca token como revocado (in-memory).
 * Nota: para producción usa Redis / BD para persistencia en múltiples instancias.
 */
export function revokeToken(token) {
  if (token) revokedTokens.add(token);
}

export function isTokenRevoked(token) {
  if (!token) return false;
  return revokedTokens.has(token);
}