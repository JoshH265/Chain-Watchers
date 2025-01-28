'use client'

import React, { useState } from 'react';
import axios from 'axios';

const WalletSearch: React.FC = () => {
    const [walletAddress, setWalletAddress] = useState('');
    const [tokens, setTokens] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;

    const getTokenMetadata = async (mintAddresses: string[]) => {
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

    const handleSearch = async () => {
        if (!walletAddress) {
            alert('Please enter a wallet address');
            return;
        }

        try {
            // First get all token balances
            const balanceResponse = await axios.get(
                `https://api.helius.xyz/v0/addresses/${walletAddress}/balances?api-key=${apiKey}`
            );

            if (balanceResponse.data && balanceResponse.data.tokens) {
                // Filter out zero balances
                const activeTokens = balanceResponse.data.tokens.filter(
                    (token: any) => token.amount > 0
                );

                // Get mint addresses for metadata lookup
                const mintAddresses = activeTokens.map((token: any) => token.mint);

                // Get metadata for all tokens
                const metadata = await getTokenMetadata(mintAddresses);

                // Combine balance and metadata information
                const tokensWithDetails = activeTokens.map((token: any) => {
                    const tokenMetadata = metadata?.find(
                        (meta: any) => meta?.id === token.mint
                    );
                    
                    console.log('Token metadata for', token.mint, ':', tokenMetadata);
                    
                    return {
                        mint: token.mint,
                        tokenName: tokenMetadata?.content?.metadata?.name || 
                                 tokenMetadata?.content?.json?.name ||
                                 'Unknown',
                        tokenSymbol: tokenMetadata?.content?.metadata?.symbol || 
                                   tokenMetadata?.content?.json?.symbol ||
                                   '???',
                        balance: token.amount / Math.pow(10, token.decimals),
                        decimals: token.decimals
                    };
                });

                setTokens(tokensWithDetails);
                setError(null);
            } else {
                setError('No token data found');
                setTokens([]);
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to fetch tokens');
            setTokens([]);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center py-24  bg-gray-700">
            <h1 className="text-3xl font-bold mb-8 text-white">Wallet Search</h1>
            <div className="w-full max-w-md">
                <input
                    type="text"
                    placeholder="Enter wallet address"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
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
            {tokens.length > 0 && (
                <div className="mt-8 w-full max-w-2xl p-4 rounded shadow">
                    <h2 className="text-xl font-bold mb-4">Token Balances:</h2>
                    <ul>
                        {tokens.map((token) => (
                            <li key={token.mint} className="mb-4 p-4 border rounded">
                                <div><strong>Token:</strong> {token.tokenName} ({token.tokenSymbol})</div>
                                <div><strong>Balance:</strong> {token.balance}</div>
                                <div className="text-sm text-gray-500"><strong>Address:</strong> {token.mint}</div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default WalletSearch;