import axios from 'axios';

/**
 * Service for retrieving crypto price data THIS IS USED FOR THE TRANSACTION HISTORY PAGE TAB
 */
class SolPriceService {
    private currentPrice: number | null = null;
    private currentBtcPrice: number | null = null;

    /**
     * Get the current SOL price in USD
     * Uses cached value if available and fresh, fetches new data if needed
     */
    async getCurrentSolPrice(): Promise<number> {
        const now = Date.now();
        try {
            // Fetch from CoinGecko API
            const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
                params: {
                    ids: 'solana',
                    vs_currencies: 'usd'
                }
            });
            
            if (response.data?.solana?.usd) {
                this.currentPrice = response.data.solana.usd;
                console.log('Fetched new SOL price:', this.currentPrice);
                return this.currentPrice || 0;
            }
        } catch (error) {
            console.error('Error fetching SOL price from CoinGecko:', error);
        }
        
        // Return last known price or default value if fetch failed
        return this.currentPrice || 0;
    }

    /**
     * Get the current BTC price in USD
     * Fetches from CoinGecko API
    //  */
    // async getCurrentBtcPrice(): Promise<number> {
    //     try {
    //         // Fetch from CoinGecko API
    //         const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
    //             params: {
    //                 ids: 'bitcoin',
    //                 vs_currencies: 'usd'
    //             }
    //         });
            
    //         if (response.data?.bitcoin?.usd) {
    //             this.currentBtcPrice = response.data.bitcoin.usd;
    //             console.log('Fetched new BTC price:', this.currentBtcPrice);
    //             return this.currentBtcPrice || 0;
    //         }
    //     } catch (error) {
    //         console.error('Error fetching BTC price from CoinGecko:', error);
    //     }
        
    //     // Return last known price or default value if fetch failed
    //     return this.currentBtcPrice || 0;
    // }
}

// Export a singleton instance
export const solPriceService = new SolPriceService();