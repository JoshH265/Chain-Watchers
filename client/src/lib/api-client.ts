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


// // CORE: Keep track of last request time to prevent flooding
// let lastTokenPriceRequest = 0;
// let lastSolPriceRequest = 0;

// // CORE: Minimum time between requests (2 seconds)
// const REQUEST_THROTTLE = 2000;


// TO BE DELTED - CANNOT DO MULTI TOKEN SEARCH DUE TO API LIMITS - NOT PAYING $100 FOR ANOTHER
// API KEY WHEN I ALREADY PAY $50+ FOR HELIUS
// /**
//  * Gets token price and market cap data for multiple tokens
//  * @param tokenAddresses Array of token mint addresses
//  * @returns Promise with token price data including market cap
//  */

// export async function getTokenPriceData(tokenAddresses: string[]){
//   try {

//     if (!tokenAddresses || tokenAddresses .length === 0) {
//       return [];
//     }


//     // CORE: Enforce minimum time between requests
//     const now = Date.now();
//     const timeSinceLastRequest = now - lastTokenPriceRequest;
    
//     if (timeSinceLastRequest < REQUEST_THROTTLE) {
//       // CORE: Wait before making the request
//       await new Promise(resolve => 
//         setTimeout(resolve, REQUEST_THROTTLE - timeSinceLastRequest)
//       );
//     }
//     lastTokenPriceRequest = Date.now();


//   // Converts address array into a string for API
//   const addressString = tokenAddresses.join(',');
//   const response = await fetch(`${API_URL}/api/crypto-price/birdeye/token-prices?addresses=${addressString}`);


//     if (!response.ok) {
//       // CORE: Handle rate limiting specifically
//       if (response.status === 429) {
//         console.warn('Rate limited by Birdeye API. Try again later.');
//         return []; // Return empty array rather than throwing
//       }
//       throw new Error('Failed to fetch token price data');
//     }
    
//     return response.json();
//   } catch (error) {
//     console.error('Error fetching token price data:', error);
//     // Return empty array as fallback to prevent UI breaks
//     return [];
//   }
// }

// I AM 90% SURE I AM NOT USING THIS FUNCTION SO COMMENTING OUT FOR TESTING
// /**
//  * Gets current SOL price from backend
//  * @returns Promise with SOL price in USD
//  */
// export async function getSolPrice() {
//   try {
//     // CORE: Enforce minimum time between requests
//     const now = Date.now();
//     const timeSinceLastRequest = now - lastSolPriceRequest;
    
//     if (timeSinceLastRequest < REQUEST_THROTTLE) {
//       // CORE: Wait before making the request
//       await new Promise(resolve => 
//         setTimeout(resolve, REQUEST_THROTTLE - timeSinceLastRequest)
//       );
//     }
    
//     // CORE: Update last request time
//     lastSolPriceRequest = Date.now();
    
//     // CORE: Call our SOL price endpoint (now using Birdeye)
//     const response = await fetch(`${API_URL}/api/crypto-price/sol`);
    
//     if (!response.ok) {
//       // CORE: Handle rate limiting specifically
//       if (response.status === 429) {
//         console.warn('Rate limited by Birdeye API. Using fallback SOL price.');
//         return 90; // Use fallback price for SOL
//       }
//       throw new Error('Failed to fetch SOL price');
//     }
    
//     const data = await response.json();
//     // CORE: Return price or fallback to a reasonable default
//     return data.price || 90;
//   } catch (error) {
//     console.error('Error fetching SOL price:', error);
//     // Fallback price if request fails
//     return 90;
//   }
// }

// /**
//  * Gets price data for a single token
//  * @param tokenAddresses Array containing a single token address
//  * @returns Promise with token price data
//  */
// export async function getTokenPriceDataIndividual(tokenAddresses: string[]) {
//   try {
//     if (!tokenAddresses || tokenAddresses.length === 0) {
//       return [];
//     }
    
//     // Just use the first address
//     const address = tokenAddresses[0];
    
//     // Call the single token endpoint
//     const response = await fetch(`${API_URL}/api/crypto-price/birdeye/single?address=${address}`);
    
//     if (!response.ok) {
//       if (response.status === 429) {
//         console.warn('Rate limited by Birdeye API');
//         return [];
//       }
//       console.error(`Error response from API: ${response.status}`);
//       return [];
//     }
    
//     // Log the response to debug
//     const data = await response.json();
//     console.log("Token price data received:", data);
    
//     if (data && data.price) {
//       return [{
//         address: address,
//         price: data.price,
//         priceChange24h: data.priceChange24h,
//         marketCap: data.marketCap || null,
//         volume24h: data.volume24h || null,
//         symbol: data.symbol || null
//       }];
//     }
    
//     return [];
//   } catch (error) {
//     console.error('Error fetching token price data:', error);
//     return [];
//   }
// }