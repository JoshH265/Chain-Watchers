import express, { Request, Response } from 'express';
import { getTokenMetadata, getWalletData } from '../services/wallet-search-api';

const router = express.Router();

router.post('/token-metadata', async (req: Request, res: Response) => {
  try {
    const mintAddresses = req.body.mintAddresses;
    
    if (!Array.isArray(mintAddresses)) {
      return res.status(400).json({ error: 'mintAddresses must be an array' });
    }
    
    const result = await getTokenMetadata(mintAddresses);
    res.json(result);
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    res.status(500).json({ error: 'Failed to fetch token metadata' });
  }
});

router.get('/wallet-data/:address', async (req: Request, res: Response) => {
  try {
    const address = req.params.address;
    const result = await getWalletData(address);
    res.json(result);
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    res.status(500).json({ error: 'Failed to fetch wallet data' });
  }
});

export default router;