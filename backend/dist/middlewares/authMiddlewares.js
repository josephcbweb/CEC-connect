"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt_1 = require("../utils/jwt");
class AuthMiddleware {
}
AuthMiddleware.authenticate = (req, res, next) => {
    const authHeader = req.header("Authorization");
    const token = authHeader === null || authHeader === void 0 ? void 0 : authHeader.replace("Bearer ", "");
    if (!token) {
        res.status(401).json({ message: "No token provided" });
        return;
    }
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        req.user = decoded;
        next();
    }
    catch (_a) {
        res.status(401).json({ message: "Invalid token" });
    }
};
exports.default = AuthMiddleware;
