"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/roleRoutes.ts
const express_1 = __importDefault(require("express"));
const roleController_1 = require("../controllers/roleController");
const router = express_1.default.Router();
// GET all roles with pagination & search
router.get('/', roleController_1.getAllRoles);
// POST create new role
router.post('/', roleController_1.createRole);
// PUT update role by ID
router.put('/:id', roleController_1.updateRole);
// DELETE role by ID
router.delete('/:id', roleController_1.deleteRole);
// GET role permissions
router.get('/:id/permissions', roleController_1.getRolePermissions);
// POST update role permissions
router.post('/:id/permissions', roleController_1.updateRolePermissions);
exports.default = router;
