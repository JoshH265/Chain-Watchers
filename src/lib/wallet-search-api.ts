import axios from 'axios';
import { WalletBalanceResponse, TokenMetadata, HeliusMetadataResponse } from '@/app/types';

const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;

// A simple delay function that returns a Promise
const delay = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

export const getWalletData = async (
  walletAddress: string
): Promise<{ solBalance: number; tokens: any[] }> => {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const response = await axios.get<WalletBalanceResponse>(
        `https://api.helius.xyz/v0/addresses/${walletAddress}/balances?api-key=${apiKey}`
      );

      const solBalance = response.data.nativeBalance
        ? response.data.nativeBalance / Math.pow(10, 9)
        : 0;

      const tokens = response.data.tokens
        ? response.data.tokens.filter(token => token.amount > 0)
        : [];

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