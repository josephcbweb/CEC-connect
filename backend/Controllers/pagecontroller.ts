import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getUserNames = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true, // Just get the username (name)
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    res.json(users); // Simple array of {id, username}
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};