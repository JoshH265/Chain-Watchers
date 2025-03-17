// Import necessary modules and functions
import express, { Request, Response } from 'express';
import { getTokenMetadata, getWalletData } from '../services/wallet-search-api';

const router = express.Router();

// POST /token-metadata: Retrieves token metadata for provided mint addresses.
router.post('/token-metadata', async (req: Request, res: Response) => {
  try {
    // Log incoming request data
    console.log('Token metadata request received:', req.body);
    const mintAddresses = req.body.mintAddresses;
    
    // Validate input format
    if (!Array.isArray(mintAddresses)) {
      console.log('Invalid mintAddresses format:', mintAddresses);
      return res.status(400).json({ error: 'mintAddresses must be an array' });
    }
    
    // Log number of tokens to fetch
    console.log('Fetching metadata for', mintAddresses.length, 'tokens');
    const result = await getTokenMetadata(mintAddresses);
    // Log result status
    console.log('Metadata fetch result:', result ? 'Success' : 'Empty result');
    res.json(result);
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    res.status(500).json({ error: 'Failed to fetch token metadata' });
  }
});

// Route to fetch wallet data by address
router.get('/:address', async (req: Request, res: Response) => {
  try {
    // Extract wallet address from URL params
    const address = req.params.address;
    const result = await getWalletData(address);
    res.json(result);
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    res.status(500).json({ error: 'Failed to fetch wallet data' });
  }
});

export default router;