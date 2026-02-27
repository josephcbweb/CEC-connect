
// routes/roleRoutes.ts
import express from 'express';
import {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  updateRolePermissions
} from '../controllers/roleController';

const router = express.Router();

// GET all roles with pagination & search
router.get('/', getAllRoles);

// POST create new role
router.post('/', createRole);

// PUT update role by ID
router.put('/:id', updateRole);

// DELETE role by ID
router.delete('/:id', deleteRole);

// GET role permissions
router.get('/:id/permissions', getRolePermissions);

// POST update role permissions
router.post('/:id/permissions', updateRolePermissions);

export default router;