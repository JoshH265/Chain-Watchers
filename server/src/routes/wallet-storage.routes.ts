import express, { Request, Response } from 'express'; 

// Import database operation functions from model file
import { getStoredWallets,addStoredWallet, updateStoredWallet,deleteStoredWallet } from '../models/stored-wallet.model';
const router = express.Router(); // Creates Express router instance

// GET - Retrieve all stored wallets
router.get('/', async (req: Request, res: Response) => {
  try {
    // Call database function to get all wallet records
    const wallets = await getStoredWallets();
    res.json(wallets); // Return wallets as JSON response
  } catch (error) {
    console.error('Error fetching stored wallets:', error);
    res.status(500).json({ error: 'Failed to fetch stored wallets' });
  }
});

// POST - Create a new wallet record
router.post('/', async (req: Request, res: Response) => {
  try {
    // Extract wallet data from request body
    const { wallet, name, tags } = req.body;
    
    // Validate required fields
    if (!wallet || !name) {
      return res.status(400).json({ error: 'Wallet address and name are required' });
    }
    
    // Call database function to create wallet record
    const newWallet = await addStoredWallet({ wallet, name, tags });
    res.status(201).json(newWallet); // Return created wallet
  } catch (error) {
    console.error('Error adding wallet to storage:', error);
    res.status(500).json({ error: 'Failed to add wallet to storage' });
  }
});

// PUT - Update an existing wallet
router.put('/', async (req: Request, res: Response) => {
  try {
    // Get wallet ID from query parameter
    const id = req.query.id as string;
    // Extract updated fields from request body
    const { wallet, name, tags } = req.body;
    
    // Validate ID parameter
    if (!id) {
      return res.status(400).json({ error: 'Wallet ID is required' });
    }
    
    // Call database function to update wallet
    const updated = await updateStoredWallet(id, { wallet, name, tags });
    
    // Return appropriate response based on update result
    if (updated) {
      res.json({ message: 'Wallet updated successfully' });
    } else {
      res.status(404).json({ error: 'Wallet not found' }); // 404 if wallet doesn't exist
    }
  } catch (error) {
    console.error('Error updating wallet:', error);
    res.status(500).json({ error: 'Failed to update wallet' });
  }
});

// DELETE - Remove a wallet
router.delete('/', async (req: Request, res: Response) => {
  try {
    // Get wallet ID from query parameter
    const id = req.query.id as string;
    
    // Validate ID parameter
    if (!id) {
      return res.status(400).json({ error: 'Wallet ID is required' });
    }
    
    // Call database function to delete wallet
    const deleted = await deleteStoredWallet(id);
    
    // Return appropriate response based on deletion result
    if (deleted) {
      res.json({ message: 'Wallet removed successfully' });
    } else {
      res.status(404).json({ error: 'Wallet not found' }); // 404 if wallet doesn't exist
    }
  } catch (error) {
    console.error('Error deleting wallet:', error);
    res.status(500).json({ error: 'Failed to delete wallet' });
  }
});

export default router;