import axios from 'axios';
import { WalletBalanceResponse, TokenMetadata, HeliusMetadataResponse } from '../types/wallet.types';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;
const apiKey = process.env.HELIUS_API_KEY;

// Debug log to check if API key is loaded
console.log('API Key loaded (first few chars):', apiKey ? apiKey.substring(0, 3) + '***' : 'undefined');

// A simple delay function that returns a Promise
const delay = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

export const getWalletData = async (walletAddress: string) => {
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

      return { solBalance, tokens };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        retries++;
        const delayTime = RETRY_DELAY * Math.pow(2, retries);
        console.warn(`Rate limited. Retrying in ${delayTime}ms...`);
        await delay(delayTime);
      } else {
        if (axios.isAxiosError(error)) {
          console.error('Axios error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
        }
        console.error('Error fetching wallet data:', error);
        throw error;
      }
    }
  }

  throw new Error('Max retries reached. Failed to fetch wallet data.');
};

export const getTokenMetadata = async (
  mintAddresses: string[]
): Promise<TokenMetadata[]> => {
  try {
    if (!apiKey) {
      throw new Error('Helius API key is not defined');
    }

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
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
    console.error('Error fetching token metadata:', error);
    return [];
  }
};