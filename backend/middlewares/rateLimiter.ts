import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../utils/types";

// Simple in-memory rate limiter
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up old records every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 60 * 1000);

/**
 * Rate limiter middleware
 * @param maxRequests Maximum number of requests allowed in the time window
 * @param windowMs Time window in milliseconds
 */
export const rateLimiter = (maxRequests: number, windowMs: number) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Get user identifier (IP address or user ID from token if available)
    const identifier = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${identifier}:${req.path}`;
    
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record) {
      // First request from this identifier
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
      return;
    }

    if (record.resetTime < now) {
      // Window has expired, reset the counter
      record.count = 1;
      record.resetTime = now + windowMs;
      next();
      return;
    }

    if (record.count >= maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.status(429).json({
        error: "Too many requests. Please try again later.",
        retryAfter,
      });
      return;
    }

    // Increment the counter
    record.count += 1;
    next();
  };
};
