import axios from 'axios';
import { TokenMetadata, HeliusMetadataResponse, WalletToken } from '../types/transactions.types';
import dotenv from 'dotenv';
dotenv.config();

const MAX_RETRIES = 5; // Maximum number of retries for rate limiting
const RETRY_DELAY = 2500; // ms
const apiKey = process.env.HELIUS_API_KEY;

// https://docs.helius.dev/
// https://stackoverflow.com/questions/79487358/how-can-i-get-all-token-information-in-my-solana-wallet
// Claude sonnet 3.7
// Discord ticket inside Helius Discord server
export const getWalletdata = async (walletAddress: string) => {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      if (!apiKey) { // API key check - not really needed but leave
        throw new Error('Helius API key is not defined');
      }
      // Construct API endpoint URL with wallet address + API key
      // Make API request for sol balance and token holdings of wallet
      const url = `https://api.helius.xyz/v0/addresses/${walletAddress}/balances?api-key=${apiKey}`;
      const response = await axios.get(url);

      // Convert SOL balance from lamports to SOL (1 SOL = 10^9 lamports)
      let solBalance = 0;
      if (response.data.nativeBalance) {
        // Consulted with a friend about conversion. Said to use this method
        solBalance = response.data.nativeBalance / 1e9; 
      }
      // Filter out tokens with zero balance
      const tokens = response.data.tokens
        ? response.data.tokens.filter((token: { amount: number }) => token.amount > 0)
        : []; // Tenary check for tokens in wallet or returns empty array

      return { solBalance, tokens };

    } catch (error) {
      // Specific handling for rate limiting (HTTP 429 responses)
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        // Increment retry counter
        retries++;
        console.warn(`Rate limited. Retrying in ${RETRY_DELAY}ms...`);
        // promise waits for delay before retrying, help reduce rate limit
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else { // Non rate limit errors
        console.error('Error fetching wallet data:', error);
        throw error;
      }
    }
  }
  throw new Error('Max retries reached. Failed to fetch wallet data.');
};


/**
 * Retrieves metadata for multiple tokens by  mint addresses.
 * fetches token metadata via a batch request to the Helius API,
 * 
 * @param mintAddresses - Array of token mint addresses to fetch metadata for
 * @returns Promise resolving to an array of TokenMetadata objects
 * 
 * https://www.helius.dev/docs/api-reference/das/getassetbatch#getassetbatch
 */
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