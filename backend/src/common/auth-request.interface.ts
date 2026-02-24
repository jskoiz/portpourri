/**
 * Shape of `req.user` attached by the JWT Passport strategy.
 */
export interface JwtUser {
  id: string;
  email: string;
}

/**
 * Minimal typed shape of the Express request after JWT authentication.
 *
 * We intentionally do NOT extend express.Request here so that TypeScript's
 * emitDecoratorMetadata does not attempt to emit a runtime reference to the
 * Express Request class, which would trigger TS1272 with isolatedModules.
 * Controllers should import this with `import type`.
 */
export interface AuthenticatedRequest {
  user: JwtUser;
}
