import express, { Request, Response } from 'express'; 
import { getTokenMetadata, getWalletdata } from '../services/wallet-search-service';

const router = express.Router(); // Express router for endpoints

// https://docs.helius.xyz/
// Claude 3.7 sonnet
// https://expressjs.com/en/5x/api.html#express.router
router.post('/token-metadata', async (req: Request, res: Response) => { // Define POST endpoint for batch token metadata retrieval
  try {
    const mintAddresses = req.body.mintAddresses; // Extract token addresses from request body
    
    // 
    if (!Array.isArray(mintAddresses)) { // Checks data type of mintAddresses - must be an array
      return res.status(400).json({ error: 'mintAddresses must be an array' }); 
    }
    // Fetch token metadata using wallet-search-service
    const result = await getTokenMetadata(mintAddresses); // Call function to fetch data from Helius
    res.json(result);
  } catch (error) {
    console.error('Error fetching token metadata:', error); // backend error logging
    res.status(500).json({ error: 'Failed to fetch token metadata' }); // HTTP error response
  }
});

router.get('/:address', async (req: Request, res: Response) => { // Define GET endpoint with dynamic param 
  try {// /:address dynamic param is based on wallet address
    const address = req.params.address; 
    const result = await getWalletdata(address); 
    res.json(result); 
  } catch (error) {
    console.error('Error fetching wallet data:', error); 
    res.status(500).json({ error: 'Failed to fetch wallet data' }); 
  }
});

export default router;