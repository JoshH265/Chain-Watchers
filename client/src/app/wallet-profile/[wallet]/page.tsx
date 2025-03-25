'use client'

import React from 'react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import { getTokenMetadata, getWalletData } from '@/lib/api-client';
import { Token, TokenMetadata, TokenWithDetails, Wallet } from '../../../types/types';
import WalletTabs, { TabContent } from '@/components/wallet-tabs';
import TransactionHistory from '@/components/transaction-history';

const copyToClipboard = async (text: string): Promise<void> => {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
};

export default function WalletProfile() {
    const params = useParams();
    const walletAddress = params.wallet as string;
    const [walletData, setWalletData] = useState<Wallet | null>(null);
    const [tokens, setTokens] = useState<TokenWithDetails[]>([]);
    const [solBalance, setSolBalance] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWalletData = async () => {
            try {
              setIsLoading(true);
              
              const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
              // Pass the wallet address as a query parameter
              const response = await fetch(`${API_URL}/api/wallet-profile?address=${walletAddress}`);
          
              if (!response.ok) {
                throw new Error('Failed to fetch wallet profile');
              }
          
              const data = await response.json();
              setWalletData(data);

                const { solBalance, tokens: activeTokens } = await getWalletData(walletAddress);

                setSolBalance(parseFloat(solBalance.toFixed(2)));

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
                console.error('Error fetching wallet data:', error);
                setError('Failed to load wallet data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchWalletData();
    }, [walletAddress]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-700 p-8">
                <div className="max-w-4xl mx-auto text-white">
                    Loading...
                </div>
            </div>
        );
    }

    if (error || !walletData) {
        return (
            <div className="min-h-screen bg-gray-700 p-8">
                <div className="max-w-4xl mx-auto text-white">
                    {error || 'Wallet not found'}
                </div>
            </div>
        );
    }

    // Token Holdings Component (extracted for clarity)
    const TokenHoldings = () => (
        <div className="mt-8 w-full max-w-2xl rounded shadow">
            {tokens.length > 0 ? (
                <ul>
                    {tokens.map((token) => (
                        <li key={token.mint} className="mb-4 p-4 rounded-lg bg-gray-500 border border-black-400">
                            <div><strong>Token:</strong> {token.tokenName} ({token.tokenSymbol})</div>
                            {token.balance > 1 && (
                                <div><strong>Balance:</strong> {token.balance}</div>
                            )}
                            <div className="text-sm text-white"><strong>Address:</strong> {token.mint}</div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-white p-4">No tokens found for this wallet.</p>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-700 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Wallet Info Card */}
                <div className="bg-gray-500 p-5 rounded-lg mb-6">
                    {/* Wallet Name Section */}
                    <h1 className="text-3xl font-bold text-black mb-2">
                        {walletData.name}
                    </h1>
                    <div className="rounded-lg text-white">
                        {/* Wallet Address Section */}
                        <div className="flex items-center space-x-2">
                            <p className="font-mono break-all font-semibold text-black">{walletData.wallet}</p>
                            <button
                                onClick={() => copyToClipboard(walletData.wallet)}
                                className="hover:bg-gray-700 rounded-full transition-colors"
                                title="Copy wallet address"
                                type="button"
                            >
                                <Copy size={16} className="text-white" />
                            </button>
                        </div>
                        {/* Tags Section */}
                        <div className="flex flex-row space-x-2 mt-2">
                            {(walletData.tags || '').split(',')
                                .filter(tag => tag.trim())
                                .map((tag, index) => (
                                    <span
                                        key={index}
                                        className="bg-gray-700 px-2 py-1 rounded-full text-sm"
                                    >
                                        {tag.trim()}
                                    </span>
                                ))}
                        </div>
                    </div>
                    {/* SOL Balance Section */}
                    {solBalance !== null && (
                        <div className="w-full max-w-2xl pt-4">
                            <h2 className="text-l font-bold">Sol balance: {solBalance}</h2>
                        </div>
                    )}
                </div>

                {/* Tabbed Interface Section */}
                <div className="bg-gray-500 p-5 rounded-lg">
                    <WalletTabs defaultTab="transactions">
                        <TabContent tab="holdings">
                            <h2 className="text-xl font-bold mb-4">Current Holdings</h2>
                            <TokenHoldings />
                        </TabContent>
                        
                        <TabContent tab="transactions">
                            <h2 className="text-xl font-bold mb-4">Transaction History</h2>
                            <TransactionHistory walletAddress={walletAddress} />
                        </TabContent>
                        
                        <TabContent tab="profitLoss">
                            <h2 className="text-xl font-bold mb-4">Profit and Loss</h2>
                            <p className="text-white">Profit and loss tracking coming soon.</p>
                        </TabContent>
                    </WalletTabs>
                </div>
            </div>
        </div>
    );
}