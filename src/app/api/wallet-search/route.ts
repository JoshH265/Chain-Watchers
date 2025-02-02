import axios from 'axios';

const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;

export const getWalletData = async (walletAddress: string) => {
    try {
        const response = await axios.get(
            `https://api.helius.xyz/v0/addresses/${walletAddress}/balances?api-key=${apiKey}`
        );

        const solBalance = response.data.nativeBalance 
            ? response.data.nativeBalance / Math.pow(10, 9) // Convert lamports to SOL
            : 0;

        const tokens = response.data.tokens 
            ? response.data.tokens.filter((token: any) => token.amount > 0)
            : [];

        return { solBalance, tokens };
    } catch (error) {
        console.error('Error fetching wallet data:', error);
        throw error;
    }
};

export const getTokenMetadata = async (mintAddresses: string[]) => {
    try {
        const response = await axios.post(
            `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
            {
                jsonrpc: "2.0",
                id: "my-id",
                method: "getAssetBatch",
                params: {
                    ids: mintAddresses
                }
            }
        );
        
        console.log('Metadata response:', response.data);
        return response.data.result || [];
    } catch (error) {
        console.error('Error fetching token metadata:', error);
        return [];
    }
};



// DO TO LIST
// ADD THE DATABASE QUERY TO CHECK IF A WALLET THAT IS BEING SEARCHED EXISTS IN THE DATABASE
// THEN IF IT DOES PRINT THE NAME OF THE WALLET ON THE PAGE ABOVE THE SOL BALANCE

// ADD A CONNECTION/DYNAMIC PAGE FROM THE STORAGE PAGE TO THE SEARCH PAGE

