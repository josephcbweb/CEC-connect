// routes/permissionRoutes.ts
import express from 'express';
import {
  getAllPermissions,
  createPermission,
  updatePermission,
  deletePermission
} from '../controllers/permissionController';

const router = express.Router();

// GET all permissions with pagination & search
router.get('/', getAllPermissions);

// POST create new permission
router.post('/', createPermission);

// PUT update permission by ID
router.put('/:id', updatePermission);

// DELETE permission by ID
router.delete('/:id', deletePermission);

export default router;