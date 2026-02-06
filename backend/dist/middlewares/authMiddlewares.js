"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AuthMiddleware {
}
AuthMiddleware.authenticate = (req, res, next) => {
    const authHeader = req.header("Authorization");
    const token = authHeader === null || authHeader === void 0 ? void 0 : authHeader.replace("Bearer ", "");
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
exports.default = AuthMiddleware;
