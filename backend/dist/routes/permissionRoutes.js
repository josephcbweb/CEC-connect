"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/permissionRoutes.ts
const express_1 = __importDefault(require("express"));
const permissionController_1 = require("../controllers/permissionController");
const router = express_1.default.Router();
// GET all permissions with pagination & search
router.get('/', permissionController_1.getAllPermissions);
// POST create new permission
router.post('/', permissionController_1.createPermission);
// PUT update permission by ID
router.put('/:id', permissionController_1.updatePermission);
// DELETE permission by ID
router.delete('/:id', permissionController_1.deletePermission);
exports.default = router;
