import { useState, useEffect } from 'react';
import { TokenPriceData } from '@/types/types';


const DEFAULT_SOL_PRICE = 150;
const DEFAULT_BTC_PRICE = 100000 // Fallback price FOR TESTING PURPOSES ONLY

/**
 * Hook for fetching SOL and BTC prices
 * Used for general cryptocurrency price data across the application
 * @returns Object containing price states and loading status
 * https://www.helius.dev/
 * https://www.coingecko.com/learn/crypto-price-tracker-react
 * https://react.dev/reference/react/hooks
 * Claude used for debugging, and code suggestions
 */
export function useTokenPrices() {
  // States for storing fetched data
  const [solPrice, setSolPrice] = useState<number | null>(DEFAULT_SOL_PRICE);
  const [btcPrice, setBtcPrice] = useState<number | null>(DEFAULT_BTC_PRICE);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setIsLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        
        // send API request to backend for SOL price 
        const solResponse = await fetch(`${API_URL}/api/crypto-price/sol`);
        if (solResponse.ok) {
          const solData = await solResponse.json();
          setSolPrice(solData.price);
        }
        
        // send API request to backend for BTC price 
        const btcResponse = await fetch(`${API_URL}/api/crypto-price/btc`);
        if (btcResponse.ok) {
          const btcData = await btcResponse.json();
          setBtcPrice(btcData.price);
          console.log("BTC price");
        }
      } catch (error) {
        console.error('Failed to fetch crypto prices:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPrices();
  }, []); // dependency array - only runs when page loads - reduce API calls ALOT
  return { solPrice, btcPrice, isLoading };
}

/**
 * Hook for fetching specific token price data
 * @param tokenAddresses Array of token mint addresses to fetch price data for
 * @returns Object with token price data, SOL price, and loading states
 */
export function useTokenPriceData(tokenAddresses: string[]) {
  // CORE: State for storing token-specific price data
  const [tokenPrices, setTokenPrices] = useState<TokenPriceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Checks for token address if no token addresses provided then skips
    if (!tokenAddresses || tokenAddresses.length === 0) {
      setTokenPrices([]);
      return;
    }    
    const fetchPriceData = async () => {
      try {
        setIsLoading(true);
        
          const API_URL = process.env.NEXT_PUBLIC_API_URL;
          const response = await fetch(
            // Only fetch price for first token address (cant do multi price)
            `${API_URL}/api/crypto-price/birdeye/single?address=${tokenAddresses[0]}`
          );
          
          if (response.ok) {
            const data = await response.json();
            console.log("Token price data received:", data);
            setTokenPrices([data]); // Stores response from API
        }
      } catch (err) {
        console.error('Failed to fetch crypto prices:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPriceData();
  }, []); 

  return { tokenPrices, isLoading };
}