import axios from 'axios';
import { TokenMetadata, HeliusMetadataResponse } from '../types/wallet.types';
import dotenv from 'dotenv';
import { saveWalletData, getWalletByAddress } from '../models/wallet.model';

// Ensure environment variables are loaded
dotenv.config();

const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;
const apiKey = process.env.HELIUS_API_KEY;

// A simple delay function that returns a Promise
const delay = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

export const getWalletData = async (walletAddress: string) => {
  // First, try to get wallet data from the database
  const cachedWallet = await getWalletByAddress(walletAddress);
  
  // If data exists and is recent (less than 10 minutes old), return it
  const TEN_MINUTES = 10 * 60 * 1000;
  if (cachedWallet && (new Date().getTime() - cachedWallet.lastUpdated.getTime() < TEN_MINUTES)) {
    console.log('Returning cached wallet data for:', walletAddress);
    return {
      solBalance: cachedWallet.solBalance,
      tokens: cachedWallet.tokens.map(token => ({
        mint: token.mint,
        amount: token.balance * Math.pow(10, token.decimals),
        decimals: token.decimals,
        tokenName: token.tokenName,
        tokenSymbol: token.tokenSymbol
      }))
    };
  }

  // Otherwise, fetch fresh data from the API
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      if (!apiKey) {
        throw new Error('Helius API key is not defined');
      }

      const url = `https://api.helius.xyz/v0/addresses/${walletAddress}/balances?api-key=${apiKey}`;
      
      const response = await axios.get(url);

      const solBalance = response.data.nativeBalance
        ? response.data.nativeBalance / Math.pow(10, 9)
        : 0;

      const tokens = response.data.tokens
        ? response.data.tokens.filter((token: { amount: number }) => token.amount > 0)
        : [];

      // Save to database
      await saveWalletData({
        address: walletAddress,
        solBalance,
        tokens
      });

      return { solBalance, tokens };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        retries++;
        const delayTime = RETRY_DELAY * Math.pow(2, retries);
        console.warn(`Rate limited. Retrying in ${delayTime}ms...`);
        await delay(delayTime);
      } else {
        console.error('Error fetching wallet data:', error);
        throw error;
      }
    }
  }

  throw new Error('Max retries reached. Failed to fetch wallet data.');
};

// Keep your existing getTokenMetadata function unchanged
export const getTokenMetadata = async (
  mintAddresses: string[]
): Promise<TokenMetadata[]> => {
  try {
    const response = await axios.post<HeliusMetadataResponse>(
      `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
      {
        jsonrpc: "2.0",
        id: "my-id",
        method: "getAssetBatch",
        params: {
          ids: mintAddresses,
        },
      }
    );

    return response.data.result || [];
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return [];
  }
};