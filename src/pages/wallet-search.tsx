import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WalletSearch: React.FC = () => {
   const [walletAddress, setWalletAddress] = useState('');
   const [tokenBalances, setTokenBalances] = useState<any[]>([]);
   const [error, setError] = useState<string | null>(null);
   const [tokenList, setTokenList] = useState<any[]>([]);
   const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

   useEffect(() => {
       fetchJupiterTokenList();
   }, []);

   const fetchJupiterTokenList = async () => {
       try {
           const response = await axios.get('https://token.jup.ag/all');
           setTokenList(response.data);
       } catch (error) {
           console.error('Error fetching Jupiter token list:', error);
       }
   };

   const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
       setWalletAddress(event.target.value);
   };

   const handleSearch = async () => {
       if (!walletAddress) {
           alert('Please enter a wallet address');
           return;
       }

       setError(null);

       const requestOptions = {
           method: 'post',
           url: `https://solana-mainnet.g.alchemy.com/v2/${apiKey}`,
           headers: {
               'Content-Type': 'application/json',
           },
           data: {
               jsonrpc: "2.0",
               id: 1,
               method: "getTokenAccountsByOwner",
               params: [
                   walletAddress,
                   { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
                   { encoding: "jsonParsed" }
               ]
           }
       };

       try {
           const response = await axios.request(requestOptions);
           console.log("Alchemy response:", response.data);
           
           const balances = response.data.result.value;
           console.log("Balances:", balances);
           
           const tokenMetadataPromises = balances.map((account: any) => {
               const mintAddress = account.account.data.parsed.info.mint;
               console.log("Processing mint address:", mintAddress);
               return fetchTokenMetadata(mintAddress);
           });
           
           const tokenMetadata = await Promise.all(tokenMetadataPromises);
           console.log("Token metadata:", tokenMetadata);
           
           const combinedData = balances
               .map((account: any, index: number) => ({
                   ...account,
                   tokenName: tokenMetadata[index]?.name || 'Unknown Token',
                   tokenSymbol: tokenMetadata[index]?.symbol || 'Unknown'
               }))
               .filter(account => parseFloat(account.account.data.parsed.info.tokenAmount.uiAmount) > 0);
           
           console.log("Combined data:", combinedData);
           setTokenBalances(combinedData);
           setError(null);
       } catch (error) {
           console.error('Error fetching token balances:', error);
           setError('Error fetching token balances. Please try again.');
           setTokenBalances([]);
       }
   };

   const fetchTokenMetadata = async (mintAddress: string) => {
    try {
        const token = tokenList.find((token: any) => 
            mintAddress.toLowerCase().includes(token.address.toLowerCase()) || 
            token.address.toLowerCase().includes(mintAddress.toLowerCase())
        );
        return token || { name: 'Unknown Token', symbol: 'Unknown' };
        } catch (error) {
            console.error('Error fetching token metadata:', error);
            return { name: 'Unknown Token', symbol: 'Unknown' };
        }
    };

   return (
       <div className="min-h-screen flex flex-col items-center justify-center py-24 bg-black-100">
           <h1 className="text-3xl font-bold mb-8">Wallet Search</h1>
           <div className="w-full max-w-md">
               <input
                   type="text"
                   placeholder="Enter wallet address"
                   value={walletAddress}
                   onChange={handleInputChange}
                   className="w-full px-4 py-2 border rounded mb-4"
               />
               <button
                   onClick={handleSearch}
                   className="w-full px-4 py-2 bg-blue-600 text-white rounded"
               >
                   Search
               </button>
           </div>
           {error && <p className="text-red-500 mt-4">{error}</p>}
           {tokenBalances.length > 0 && (
               <div className="mt-8 w-full max-w-2xl p-4 rounded shadow">
                   <h2 className="text-xl font-bold mb-4">SPL Token Balances:</h2>
                   <ul>
                       {tokenBalances.map((account: any) => (
                           <li key={account.pubkey} className="mb-4 p-4 border rounded">
                               <div><strong>Token Name:</strong> {account.tokenName}</div>
                               <div><strong>Symbol:</strong> {account.tokenSymbol}</div>
                               <div><strong>Balance:</strong> {account.account.data.parsed.info.tokenAmount.uiAmountString}</div>
                               <div className="text-sm text-gray-500 break-all">
                                   <strong>Token Address:</strong> {account.account.data.parsed.info.mint}
                               </div>
                           </li>
                       ))}
                   </ul>
               </div>
           )}
       </div>
   );

   
};

export default WalletSearch;


//  Notes for tomorrow: 
//     Solscan is dogshit and doesn't have a public API.
//     Alchemy provides some info but not all. 
//     JUP API need to look into more to get working and provide token name/info
//     IF I HAVE ISSUES WITH THIS STUFF AND I CANNOT FIND A SOLUTION WITHOUT BUYING SOMETHING
//     THEN I WILL PROBABLY JUST SWAP TO BUILDING THE PROJECT ON ETH/EVM CHAINS AND DO SOL LATER OR SOME SHIT 

