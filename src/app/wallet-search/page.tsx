'use client'

import React, { useState } from 'react';
import { getTokenMetadata, getWalletData } from '../../lib/wallet-search-api';

// Defines structure for token metadata response and does not use ANY type
interface TokenMetadata {
  id?: string;
  content?: {
    metadata?: {
      name?: string;
      symbol?: string;
    };
    json?: {
      name?: string;
      symbol?: string;
    };
  };
}

interface Token {
  mint: string;
  amount: number;
  decimals: number;
}

interface TokenWithDetails {
  mint: string;
  tokenName: string;
  tokenSymbol: string;
  balance: number;
  decimals: number;
}

const WalletSearch: React.FC = () => {
    const [walletAddress, setWalletAddress] = useState('');
    const [tokens, setTokens] = useState<TokenWithDetails[]>([]);
    const [solBalance, setSolBalance] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!walletAddress) {
            alert('Please enter a wallet address');
            return;
        }

        try {
            const { solBalance, tokens: activeTokens } = await getWalletData(walletAddress);

            setSolBalance(parseFloat(solBalance.toFixed(2))); // Set the SOL balance in state with 2 decimal points

            if (activeTokens.length > 0) {
                const mintAddresses = activeTokens.map((token: Token) => token.mint);
                const metadata = await getTokenMetadata(mintAddresses);

                const tokensWithDetails = activeTokens.map((token: Token) => {
                    const tokenMetadata = metadata?.find(
                        (meta: TokenMetadata) => meta?.id === token.mint
                    );

                    return {
                        mint: token.mint,
                        tokenName: tokenMetadata?.content?.metadata?.name || 
                                 tokenMetadata?.content?.json?.name ||
                                 'Unknown',
                        tokenSymbol: tokenMetadata?.content?.metadata?.symbol || 
                                   tokenMetadata?.content?.json?.symbol ||
                                   '???',
                        balance: parseFloat((token.amount / Math.pow(10, token.decimals)).toFixed(2)),
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
            setSolBalance(null);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center py-10  bg-gray-700">
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

            {solBalance !== null && (
                <div className="mt-8 w-full max-w-2xl pt-4 rounded shadow">
                    <h2 className="text-xl font-semibold">TEST</h2>
                    <h2 className="text-l font-bold">Sol balance: {solBalance}</h2>
                </div>
            )}
            {tokens.length > 0 && (
                <div className="mt-8 w-full max-w-2xl rounded shadow">
                    <h2 className="text-xl font-bold mb-4">Tokens:</h2>
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