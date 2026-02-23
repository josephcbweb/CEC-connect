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
const authServices_1 = __importDefault(require("../services/authServices"));
class AuthController {
}
_a = AuthController;
AuthController.signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password)
            return res.status(400).json({ message: 'please give required fields' });
        const existingUser = yield authServices_1.default.findUserByEmail(email);
        if (existingUser)
            return res.status(400).json({ message: 'user has already registered' });
        const user = yield authServices_1.default.registerUser(username, email, password);
        return res.status(201).json(user);
    }
    catch (error) {
        res.status(400).json({ message: 'registration failed', error });
    }
});
AuthController.login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(req.body);
        const { email, password } = req.body;
        const token = yield authServices_1.default.loginUser(email, password);
        return res.status(200).json({ token });
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ message: 'login failed', error });
    }
});
AuthController.getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "User ID is required" });
        }
        const foundUser = yield authServices_1.default.findUserById(parseInt(id));
        return res.json({ foundUser: foundUser, user: user });
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching user", error });
    }
});
AuthController.StudentLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(req.body);
        const { email, password } = req.body;
        const token = yield authServices_1.default.loginStudent(email, password);
        return res.status(200).json({ token });
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ message: 'login failed', error });
    }
});
AuthController.getStudentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "User ID is required" });
        }
        const foundUser = yield authServices_1.default.findStudentById(parseInt(id));
        return res.json({ foundUser: foundUser, user: user });
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching user", error });
    }
});
exports.default = AuthController;
