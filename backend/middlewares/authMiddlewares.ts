import type { NextFunction } from "express";
import type { Response, Request } from "express";

import { verifyToken } from "../utils/jwt";
import type { AuthenticatedRequest } from "../utils/types";

class AuthMiddleware {
  static authenticate = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const authHeader = req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ message: "No token provided" });
      return;
    }
    next();
    // try {
    //   const decoded = verifyToken(token);
    //   req.user = decoded;
    //   next();
    // } catch {
    //   res.status(401).json({ message: "Invalid token" });
    // }
  };
}
export default AuthMiddleware;
