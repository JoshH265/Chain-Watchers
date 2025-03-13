import express, { Request, Response } from 'express';
import { 
  getStoredWallets, 
  addStoredWallet, 
  updateStoredWallet, 
  deleteStoredWallet 
} from '../models/stored-wallet.model';

const router = express.Router();

// GET all wallets
router.get('/', async (req: Request, res: Response) => {
  try {
    const wallets = await getStoredWallets();
    res.json(wallets);
  } catch (error) {
    console.error('Error fetching stored wallets:', error);
    res.status(500).json({ error: 'Failed to fetch stored wallets' });
  }
});

// POST - Add a new wallet
router.post('/', async (req: Request, res: Response) => {
  try {
    const { wallet, name, tags } = req.body;
    
    if (!wallet || !name) {
      return res.status(400).json({ error: 'Wallet address and name are required' });
    }
    
    const newWallet = await addStoredWallet({ wallet, name, tags });
    res.status(201).json(newWallet);
  } catch (error) {
    console.error('Error adding wallet to storage:', error);
    res.status(500).json({ error: 'Failed to add wallet to storage' });
  }
});

// PUT - Update a wallet
router.put('/', async (req: Request, res: Response) => {
  try {
    const id = req.query.id as string;
    const { wallet, name, tags } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Wallet ID is required' });
    }
    
    const updated = await updateStoredWallet(id, { wallet, name, tags });
    
    if (updated) {
      res.json({ message: 'Wallet updated successfully' });
    } else {
      res.status(404).json({ error: 'Wallet not found' });
    }
  } catch (error) {
    console.error('Error updating wallet:', error);
    res.status(500).json({ error: 'Failed to update wallet' });
  }
});

// DELETE - Remove a wallet
router.delete('/', async (req: Request, res: Response) => {
  try {
    const id = req.query.id as string;
    
    if (!id) {
      return res.status(400).json({ error: 'Wallet ID is required' });
    }
    
    const deleted = await deleteStoredWallet(id);
    
    if (deleted) {
      res.json({ message: 'Wallet removed successfully' });
    } else {
      res.status(404).json({ error: 'Wallet not found' });
    }
  } catch (error) {
    console.error('Error deleting wallet:', error);
    res.status(500).json({ error: 'Failed to delete wallet' });
  }
});

export default router;