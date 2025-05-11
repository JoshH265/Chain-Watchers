// JSDoc annoations recommended to be utilised by Claude 3.7 Sonnet
// API functionality made with the assistnce of https://docs.helius.dev/ with debugging help via public discord chats

const API_URL = process.env.NEXT_PUBLIC_API_URL;
import { TransactionHistoryResponse } from '../../../shared/src/types/transaction.types';


/**
 * Fetches metadata for multiple tokens by their mint addresses
 * @param mintAddresses Array of token mint addresses to fetch metadata for
 * @returns Promise with token metadata information
 */
export async function getTokenMetadata(mintAddresses: string[]) {
  const response = await fetch(`${API_URL}/api/wallet-data/token-metadata`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mintAddresses }), // Send mint addresses in request body
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch token metadata');
  }
  
  return response.json();
}

/**
 * Retrieves balance and token data for a specific wallet address
 * @param address Blockchain wallet address to query
 * @returns Promise with wallet balance and token holdings
 */
export async function getWalletdata(address: string) {
  const response = await fetch(`${API_URL}/api/wallet-data/${address}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch wallet data');
  }
  
  return response.json();
}

/**
 * Gets all wallets saved in the storage system
 * @returns Promise with array of stored wallet objects
 */
export async function getStoredWallets() {
  const response = await fetch(`${API_URL}/api/wallet-storage`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch stored wallets');
  }
  
  return response.json();
}

/**
 * Adds a new wallet to the storage system
 * @param data Object containing wallet address, optional label and tags
 * @returns Promise with the newly created wallet record
 */
export async function addWalletToDatabase(data: { wallet: string; name: string; tags: string }) {
  const response = await fetch(`${API_URL}/api/wallet-storage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add wallet');
  }
  
  return response.json();
}

/**
 * Removes a wallet from the storage system
 * @param id ID of the wallet to be deleted
 * @returns Promise with deletion confirmation
 */
export async function removeWalletFromDatabase(id: string) {
  const response = await fetch(`${API_URL}/api/wallet-storage?id=${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to remove wallet');
  }
  
  return response.json();
}

/**
 * Updates an existing wallet in the storage system
 * @param id ID of the wallet to update
 * @param data Updated wallet information
 * @returns Promise with the updated wallet record
 */
export async function updateWalletInDatabase(id: string, data: { wallet: string; name: string; tags: string }) {
  const response = await fetch(`${API_URL}/api/wallet-storage?id=${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update wallet');
  }
  
  return response.json();
}

/**
 * Fetch transaction history for a wallet
 */
export async function getTransactionHistory(
  walletAddress: string,
  options: {
    limit?: number;
    before?: string;
    after?: string;
    cursor?: string;
  } = {}
): Promise<TransactionHistoryResponse> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.before) queryParams.append('before', options.before);
    if (options.after) queryParams.append('after', options.after);
    if (options.cursor) queryParams.append('cursor', options.cursor);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    const response = await fetch(
      `${API_URL}/api/transaction-history/transactions/${walletAddress}${queryString}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch transaction history');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
}
