import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

export function requireAdmin(req, _res, next) {
  const address = req.socket.remoteAddress || req.ip || '';
  const isLoopback = address === '127.0.0.1' || address === '::1' || address.endsWith('::ffff:127.0.0.1');
  const origin = (req.get('origin') || '').replace(/\/$/, '');
  const referer = req.get('referer') || '';
  const forwardedProto = req.get('x-forwarded-proto') || 'https';
  const forwardedHost = req.get('x-forwarded-host') || req.get('host') || '';
  const deploymentOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : '';
  const configuredOrigin = (env.clientOrigin || '').replace(/\/$/, '');
  const sameOriginBrowser = Boolean(process.env.VERCEL) && [configuredOrigin, deploymentOrigin]
    .filter(Boolean)
    .some((candidate) => origin === candidate || referer.startsWith(`${candidate}/`));
  if (env.localAdminAutoAuth && isLoopback) return next();
  if (sameOriginBrowser) return next();
  if (!env.adminApiKey) return next(new AppError(503, 'ADMIN_NOT_CONFIGURED', 'Administrative features are disabled until ADMIN_KEY is configured.'));
  if (req.get('x-admin-key') !== env.adminApiKey) return next(new AppError(401, 'UNAUTHORIZED', 'A valid administrative API key is required.'));
  next();
}
