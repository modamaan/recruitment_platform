import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(new URL(process.env.NEON_AUTH_JWKS_URL!));

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const baseUrl = process.env.NEON_AUTH_BASE_URL || "";
    let expectedIssuer = baseUrl;
    try {
      expectedIssuer = new URL(baseUrl).origin;
    } catch (e) { }

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: expectedIssuer,
      clockTolerance: '15s',
    });
    (req as any).user = { id: payload.sub };
    next();
  } catch (error: any) {
    if (error?.code === 'ERR_JWT_EXPIRED') {
      console.warn(`[requireAuth] JWT expired for ${req.method} ${req.path}`);
      return res.status(401).json({ error: 'Token expired', code: 'ERR_JWT_EXPIRED' });
    }
    console.error("JWT Verification failed:", error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Optional auth: parses user if token exists, but doesn't block if missing
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const baseUrl = process.env.NEON_AUTH_BASE_URL || "";
    let expectedIssuer = baseUrl;
    try {
      expectedIssuer = new URL(baseUrl).origin;
    } catch (e) { }

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: expectedIssuer,
      clockTolerance: '15s',
    });
    (req as any).user = { id: payload.sub };
  } catch (e) {
    // Ignore verification errors for optional auth
  }
  next();
};
