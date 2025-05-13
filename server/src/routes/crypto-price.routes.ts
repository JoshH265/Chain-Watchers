import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { tokenData } from '../types/token-price.types';

dotenv.config();

const router = express.Router();

// GET btc price
router.get('/btc', async (req, res) => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const price = response.data.bitcoin.usd;
    res.json({ price });
  } catch (error) {
    console.error('Error getting BTC price:', error);
    res.status(500).json({ error: 'Failed to retrieve BTC price' });
  }
});

// GET sol price
router.get('/sol', async (req, res) => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const price = response.data.solana.usd; // extracts price
    res.json({ price }); // sends json reponse via express
  } catch (error) {
    console.error('Error getting SOL price:', error);
  }
});

// GET /api/crypto-price/birdeye/single - Get price for a single token
// https://docs.birdeye.so/reference/get-defi-price
router.get('/birdeye/single', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) { // checks if address is provided
      return res.status(400).json({ error: 'Token address required' });
    }

    const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;
    if (!BIRDEYE_API_KEY) { // Checks API key
      return res.status(500).json({ error: 'API key not configured' });
    }
    // Sends API request to birdeye for token price
    const response = await axios.get(
      `https://public-api.birdeye.so/defi/price?address=${address}`,
      {
        headers: {
          'X-API-KEY': BIRDEYE_API_KEY,
          'x-chain': 'solana',
          'Content-Type': 'application/json',
        },
      }
    );
    const tokenData = response.data?.data;
    if (!tokenData) {
      return res.status(404).json({ error: 'Token data not found' });
    }
    // Format response data with needed fields to pass to frontend
    const formatted = {
      address: address as string, // cast to string
      price: tokenData.value, 
      symbol: tokenData.symbol || null,
    };
    // Sends formatted response data via express response
    res.json(formatted);

  } catch (error) { // error handling
    console.error(`Error getting price for token:`, error);
    res.status(500).json({ error: 'Failed to retrieve token price' });
  }
});

export default router;