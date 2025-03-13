import express, { Request, Response } from 'express';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // This can be expanded to fetch more detailed wallet profile data
    // For now, return a simple response to prevent 404 errors
    res.json({ 
      name: "Wallet Profile",
      wallet: req.query.address || "",
      tags: ""
    });
  } catch (error) {
    console.error('Error fetching wallet profile:', error);
    res.status(500).json({ error: 'Failed to fetch wallet profile' });
  }
});

export default router;