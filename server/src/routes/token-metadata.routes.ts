import express, { Request, Response } from 'express';
import { getTokenMetadata } from '../services/wallet-search-api';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    //console.log('Token metadata request received:', req.body);
    const mintAddresses = req.body.mintAddresses;
    
    if (!Array.isArray(mintAddresses)) {
      console.log('Invalid mintAddresses format:', mintAddresses);
      return res.status(400).json({ error: 'mintAddresses must be an array' });
    }
    
    console.log('Fetching metadata for', mintAddresses.length, 'tokens');
    const result = await getTokenMetadata(mintAddresses);
    console.log('Metadata fetch result:', result ? 'Success' : 'Empty result');
    res.json(result);
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    res.status(500).json({ error: 'Failed to fetch token metadata' });
  }
});

export default router;