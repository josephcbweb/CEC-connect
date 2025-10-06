import type {NextFunction} from 'express';
import type {Response,Request} from 'express';

import {verifyToken} from '../utils/jwt';
import type { AuthenticatedRequest } from '../utils/types';

class AuthMiddleware{
  static authenticate = (req: AuthenticatedRequest, res: Response,
    next: NextFunction)=>{
      const token = req.header("Autherization")?.replace(' Bearer','');
      if(!token)return res.status(401).json({message: 'no token provided'});
      try{
        const decoded = verifyToken(token)
        req.user = decoded;
        next();
      }catch{
        res.status(401).json({message:'Invalid token'});
      }
    };
}
export default AuthMiddleware;