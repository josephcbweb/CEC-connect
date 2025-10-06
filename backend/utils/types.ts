import type {JwtPayload} from 'jsonwebtoken';
import type {Request} from 'express';
export interface AuthenticatedRequest extends Request{
  user?: string | JwtPayload;
}