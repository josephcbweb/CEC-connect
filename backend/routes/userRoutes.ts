// routes/userRoutes.ts
import express from 'express';
import { 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser 
} from '../controllers/staffController';

const router = express.Router();

// GET all users with pagination & search
router.get('/', getAllUsers);

// POST create new user
router.post('/', createUser);

// PUT update user by ID
router.put('/:id', updateUser);

// DELETE user by ID (soft delete)
router.delete('/:id', deleteUser);

// Test route (optional)
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'User routes are working', timestamp: new Date() });
});

export default router;