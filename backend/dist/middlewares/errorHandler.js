"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    if (err.code === "P2002") {
        // Prisma unique constraint violation
        return res.status(409).json({
            success: false,
            error: "DuplicateEntry",
            message: "A record with this information already exists",
        });
    }
    if (err.name === "ValidationError") {
        return res.status(400).json({
            success: false,
            error: "ValidationError",
            message: err.message,
        });
    }
    res.status(500).json({
        success: false,
        error: "InternalServerError",
        message: "Something went wrong. Please try again later.",
    });
};
exports.errorHandler = errorHandler;
