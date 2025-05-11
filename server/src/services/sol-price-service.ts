import axios from 'axios';

class SolPriceService {
    private currentPrice: number | null = null;
    async getCurrentSolPrice(): Promise<number> {
        try {
            // Fetch from CoinGecko API
            //const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
                const response = await axios.get('https://public-api.birdeye.so/defi/price?address=So11111111111111111111111111111111111111112', {
                params: {
                    ids: 'solana',
                    vs_currencies: 'usd'
                }
            });
            
            if (response.data?.solana?.usd) {
                this.currentPrice = response.data.solana.usd;
                console.log('Fetched new SOL price:', this.currentPrice);
                return this.currentPrice || 150;
            }
        } catch (error) {
            console.error('Error fetching SOL price from CoinGecko:', error);
        }
        return this.currentPrice || 150;
    }
}
export const solPriceService = new SolPriceService();