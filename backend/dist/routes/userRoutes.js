"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/userRoutes.ts
const express_1 = __importDefault(require("express"));
const staffController_1 = require("../controllers/staffController");
const router = express_1.default.Router();
// GET all users with pagination & search
router.get('/', staffController_1.getAllUsers);
// POST create new user
router.post('/', staffController_1.createUser);
// PUT update user by ID
router.put('/:id', staffController_1.updateUser);
// DELETE user by ID (soft delete)
router.delete('/:id', staffController_1.deleteUser);
// Test route (optional)
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'User routes are working', timestamp: new Date() });
});
exports.default = router;
