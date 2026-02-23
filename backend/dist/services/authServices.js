"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = require("../lib/prisma");
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET;
class AuthService {
}
_a = AuthService;
AuthService.registerUser = (username, email, password) => __awaiter(void 0, void 0, void 0, function* () {
    const hashedpassword = yield bcryptjs_1.default.hash(password, 10);
    const user = yield prisma_1.prisma.user.create({
        data: {
            username,
            email,
            passwordHash: hashedpassword,
        },
    });
    return user;
});
AuthService.findUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.prisma.user.findUnique({
        where: { id: id },
    });
});
AuthService.findUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.prisma.user.findUnique({
        where: { email: email },
        include: {
            userRoles: {
                include: {
                    role: {
                        include: { permissions: { include: { permission: true } } },
                    },
                },
            },
        },
    });
});
AuthService.loginUser = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield _a.findUserByEmail(email);
    if (!user)
        throw new Error("User not found");
    console.log(password);
    const isMatch = yield bcryptjs_1.default.compare(password, user.passwordHash);
    if (!isMatch)
        throw new Error("Invalid Password");
    const token = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
        expiresIn: "30d",
    });
    const roles = user.userRoles.map((role) => role.role.name);
    const permissions = user.userRoles.flatMap((role) => role.role.permissions.map((perm) => perm.permission.name));
    const tokenWithUser = {
        user: {
            id: user.id,
            name: user.username,
            email: user.email,
            role: roles,
            permission: permissions,
        },
        token,
    };
    return tokenWithUser;
});
AuthService.findStudentById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.prisma.student.findUnique({
        where: { id: id },
    });
});
AuthService.findStudentByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.prisma.student.findUnique({
        where: { email: email },
    });
});
AuthService.loginStudent = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield _a.findStudentByEmail(email);
    if (!user)
        throw new Error("User not found");
    console.log(password);
    const isMatch = yield bcryptjs_1.default.compare(password, user.password);
    if (!isMatch)
        throw new Error("Invalid Password");
    const token = jsonwebtoken_1.default.sign({ userId: user.id, username: user.name }, JWT_SECRET, {
        expiresIn: "30d",
    });
    return token;
});
exports.default = AuthService;
