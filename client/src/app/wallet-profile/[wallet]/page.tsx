'use client'

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { getTokenMetadata, getWalletdata, getStoredWallets, addWalletToDatabase, updateWalletInDatabase, removeWalletFromDatabase } from '@/lib/api-client';
import { Token, TokenMetadata, TokenWithDetails, Wallet } from '../../../types/types';
import WalletTabs, { TabContent } from '@/components/wallet-tabs';
import TransactionHistory from '@/components/transaction-history';
import AddWalletForm from '../../../components/add-wallet-form';
import { useTokenPriceData, useTokenPrices } from '@/hooks/token-price-hook';


export default function WalletProfile() {
    const params = useParams();
    const router = useRouter();
    const walletAddress = params.wallet as string;
    const [walletData, setWalletData] = useState<Wallet | null>(null);
    const [tokens, setTokens] = useState<TokenWithDetails[]>([]);
    const [solBalance, setSolBalance] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Price data 
    const { solPrice } = useTokenPrices();
    
    // New state variables for wallet management
    const [isEditingWallet, setIsEditingWallet] = useState(false);
    const [isDatabaseWallet, setIsDatabaseWallet] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState(false);

    // Separate function to fetch blockchain data (balance, tokens)
    // Fetches wallet's blockchain data (SOL balance and tokens) and processes it
    // https://docs.helius.dev/
    // Assistance from claude for debugging and checking specifics with returning token data
    const fetchBlockchainData = async () => {
        try {
            // Get blockchain data from API
            const { solBalance, tokens: activeTokens } = await getWalletdata(walletAddress);

            // Store SOL balance with 2 decimal precision
            setSolBalance(parseFloat(solBalance.toFixed(2)));

            if (activeTokens.length > 0) {
                // Get metadata for all wallet tokens in one batch request
                const mintAddresses = activeTokens.map((token: Token) => token.mint);
                const metadata = await getTokenMetadata(mintAddresses);

                // Map token data with metadata to create  token objects
                const tokensWithDetails = activeTokens.map((token: Token) => {
                    // Find matching metadata for this token
                    const tokenMetadata = metadata?.find(
                        (meta: TokenMetadata) => meta?.id === token.mint
                    );

                    // Create normalized token object with fallbacks for missing metadata 
                    // fallbacks mainly used inside DB caching but removed feature
                    return {
                        mint: token.mint,
                        tokenName: tokenMetadata?.content?.metadata?.name ||
                            tokenMetadata?.content?.json?.name ||
                            'Unknown',
                        tokenSymbol: tokenMetadata?.content?.metadata?.symbol ||
                            tokenMetadata?.content?.json?.symbol ||
                            '$?',
                        // Calculate balance to 2 decimal places
                        // .pow(10) to make it readable otherwise number is weird
                        balance: parseFloat((token.amount / Math.pow(10, token.decimals)).toFixed(2)),
                        decimals: token.decimals
                    };
                });

                // Update state with  token data
                setTokens(tokensWithDetails);
                setError(null);
            } else {
                // No tokens then set empty array
                setTokens([]);
            }
        } catch (error) {
            console.error('Error fetching blockchain data:', error);
            setError('Failed to load wallet data');
        }
    };

    // Separate function to fetch wallet information
    const fetchWalletMetadata = async () => {
        try {
            // Use getStoredWallets and filter for the specific wallet
            const allWallets = await getStoredWallets();
            // Find the wallet that matches our address
            const foundWallet = allWallets.find(
                (wallet: Wallet) => wallet.wallet === walletAddress
            );
            setIsDatabaseWallet(!!foundWallet);
            // Set the wallet data
            if (foundWallet) {
                setWalletData(foundWallet);
            } else {
                // For non-database wallets, create a basic wallet object
                setWalletData({
                    wallet: walletAddress,
                    name: '',
                    tags: ''
                } as Wallet);
            }
        } catch (error) {
            console.error('Error fetching wallet metadata:', error);
            setError('Failed to load wallet data');
        }
    };

    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                fetchWalletMetadata(),
                fetchBlockchainData()
            ]);
        } catch (error) {
            console.error('Error fetching all data:', error);
            setError('Failed to load wallet data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [walletAddress]);

    // Function to handle adding a wallet
    const handleAddWallet = async (formData: { wallet: string; name: string; tags: string }) => {
        try {
            // First check if wallet already exists in the database
            const allWallets = await getStoredWallets();
            const walletExists = allWallets.some(
                (wallet: Wallet) => wallet.wallet.toLowerCase() === walletAddress.toLowerCase()
            );
            
            if (walletExists) {
                // Show error message
                setError('This wallet is already saved in your wallet list');
                // Hide the form and show the error instead
                setIsEditingWallet(false);
                // Delay clearing the error message after some time
                setTimeout(() => setError(null), 5000);
                return;
            }

            // Ensure the wallet address in the form matches the current wallet
            const dataToSave = { ...formData, wallet: walletAddress };
            
            // Send form data to API client
            const result = await addWalletToDatabase(dataToSave);
            
            // Update local state directly instead of refetching
            setIsDatabaseWallet(true);
            setWalletData({
                ...dataToSave,
                _id: result._id // Assuming the API returns the new wallet with an _id
            } as Wallet);
            
            setIsEditingWallet(false); // Hide form
        } catch (error) {
            console.error('Error adding wallet:', error);
        }
    };

    // Function to handle editing a wallet
    const handleEditWallet = async (formData: { wallet: string; name: string; tags: string }) => {
        try {
            if (!walletData || !walletData._id) return;
            
            // Ensure the wallet address in the form matches the current wallet
            const dataToSave = { ...formData, wallet: walletAddress };
            
            // Call API client to update wallet
            await updateWalletInDatabase(walletData._id, dataToSave);
            
            // Update local state directly instead of refetching
            setWalletData({
                ...walletData,
                name: dataToSave.name,
                tags: dataToSave.tags
            });
            
            setIsEditingWallet(false); // Hide form
        } catch (error) {
            console.error('Error editing wallet:', error);
        }
    };

    // Function to handle removing a wallet
    const handleRemoveWallet = async () => {
        try {
            if (!walletData || !walletData._id) return;
            
            // Call API client to remove wallet
            await removeWalletFromDatabase(walletData._id);
            
            // Instead of redirecting, update the state to reflect the wallet is no longer saved
            setIsDatabaseWallet(false);
            
            // Update the walletData to clear saved info but keep the address
            setWalletData({
                wallet: walletAddress,
                name: '',
                tags: ''
            } as Wallet);
            
        } catch (error) {
            console.error('Error removing wallet:', error);
        }
    };

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

    const copyToClipboard = async (text: string): Promise<void> => {
        try {
            await navigator.clipboard.writeText(text);
            // Show copy feedback
            setCopyFeedback(true);
            // Hide copy feedback after 2 seconds
            setTimeout(() => {
                setCopyFeedback(false);
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

   // Token Holdings Component with price data
   // Adjusted to pass parentSolPrice as a prop to keep consistency with Profile Card and Holding Tab Prices
    const TokenHoldings = ({ parentSolPrice }: { parentSolPrice: number | null }) => {

        
        // ADD COMMENT HERE TO EXPLAIN WHAT THIS DOES.
        const largestNonSolToken = tokens // Used for showcase token (price data stuff)
            .filter(token => token.tokenSymbol !== 'SOL')
            .sort((a, b) => b.balance - a.balance)[0]; // Sort by balance to find largest holding

        /**
         * Initializes an array with the token address of the largest non-SOL token in the wallet,
         * if one exists. If there is no non-SOL token, initializes an empty array.
         * 
         * This is a conditional initialization:
         * - If largestNonSolToken exists (truthy), take its mint address and put it in an array
         * - If largestNonSolToken doesn't exist (falsy), use an empty array instead
         */
        const initialTokenAddress = largestNonSolToken ? [largestNonSolToken.mint] : [];
        const { tokenPrices, isLoading: isPriceLoading } = useTokenPriceData(initialTokenAddress);


        const filteredTokens = tokens.filter(token => {
            if (token.tokenSymbol === 'SOL') return true; // Always display Sol

            if (token.tokenSymbol === 'USDC' || token.tokenSymbol === 'USDT') {
                return token.balance > 0; // // Show stables if above 0
            }
            // For the price showcase token -> checkking for a minimum value.
            const priceData = tokenPrices.find(p => p.address === token.mint);
            if (priceData && priceData.price) {
                return token.balance * priceData.price >= 5;
            }
            // Hide tokens with less than 100 balance (on sol most traders own thousands of token
            // Makes for easy filtering in early development stages)
            return token.balance >= 100;
        });

        // Showcase token selection process
        const nonSolTokens = filteredTokens.filter(token => token.tokenSymbol !== 'SOL');
        const sortedTokens = nonSolTokens.sort((a, b) => b.balance - a.balance);
        const showcaseToken = sortedTokens.length > 0 ? [sortedTokens[0]] : [];
        
        // Format USD values of Tokens
        const formatCurrency = (value: number | null | undefined): string => {
            if (value === null || value === undefined || isNaN(value)) return '$0.00';
            
            // Sets the value to USD format
            // https://stackoverflow.com/questions/6134039/format-number-to-always-show-2-decimal-places
            return value.toLocaleString('en-US', { 
            style: 'currency', 
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
            });
        };
        
        // // Format market cap with B/M/K suffixes
        // const formatMarketCap = (value: number | undefined): string => {
        //     if (value === undefined || value === null) return '-';
            
        //     if (value >= 1e9) {
        //         return `$${(value / 1e9).toFixed(2)}B`;
        //     } else if (value >= 1e6) {
        //         return `$${(value / 1e6).toFixed(2)}M`;
        //     } else if (value >= 1e3) {
        //         return `$${(value / 1e3).toFixed(2)}K`;
        //     }
            
        //     return formatCurrency(value);
        // };
        
        // https://stackoverflow.com/questions/79487358/how-can-i-get-all-token-information-in-my-solana-wallet
        const getTokenPrice = (mint: string): number => {
            // Check token price using price hook from token-price-hooks.ts
            const priceData = tokenPrices.find(function(priceItem) {
                return priceItem.address === mint;
            });
            // Check price from hook.
            if (priceData && typeof priceData.price === 'number') {
                return priceData.price; 
            }
            const token = filteredTokens.find(function(tokenItem) {
                return tokenItem.mint === mint;
            });
            // Return price as if token not in list. and if token is SOL return the solPrice
            if (!token) return 0;
            if (token.tokenSymbol === 'SOL') return solPrice || 0;

            return 0; // Fallback
        };
        
        // // Get token market cap
        // // FIX THIS NOT WORKING ON THE WEBSITE TOMORROW - 07/05/2025 DO NOT FORGET TO FIX THIS
        // const getTokenMarketCap = (mint: string): number | undefined => {
        //     // Only show market cap for the showcase token
        //     const priceData = tokenPrices.find(p => p.address === mint);
        //     return priceData?.marketCap;
        // };
        
        // Calculate Total USD value of a specific token
        const getTokenUSDValue = (token: TokenWithDetails): number => {
            const price = getTokenPrice(token.mint);
            return token.balance * price;
        };
        
        // Calculate total portfolio value
        const calculateTotalUSDValue = (): number => {
            let total = 0;
            if (solBalance) { // Calculates sol value
                total += solBalance * (parentSolPrice!); // The ! removes null check, will never be null
            }
            filteredTokens.forEach(token => {
                // Add value of other tokens together with Sol
                total += getTokenUSDValue(token); 
            });
            return total;
        };

        return (
            <div className="w-full">
                {/* Total Value Summary */}
                <div className="mb-4 p-3 bg-gray-600 rounded-md">
                    <p className="text-lg font-semibold text-white flex items-center justify-between">
                        <span>Total USD Value: {formatCurrency(calculateTotalUSDValue())}</span>
                        {isPriceLoading && (
                            <span className="text-sm text-gray-300 animate-pulse">
                                (updating prices...)
                            </span>
                        )}
                    </p>
                </div>
                {/* Token Holdings Table */}
                {(filteredTokens.length > 0 || solBalance !== null) ? (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-600 text-white">
                                    <th className="py-2 px-4 text-left border-b border-gray-500">TOKEN</th>
                                    <th className="py-2 px-4 text-right border-b border-gray-500">AMOUNT</th>
                                    <th className="py-2 px-4 text-right border-b border-gray-500">USD VALUE</th>
                                    <th className="py-2 px-4 text-right border-b border-gray-500">MARKET CAP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* SOL Balance */}
                                {solBalance !== null && (
                                    <tr className="hover:bg-gray-600 border-b border-gray-500">
                                        <td className="py-3 px-4 text-white">
                                            <div className="flex items-center">
                                                <span className="font-medium">SOL (Solana)</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-white text-right">{solBalance}</td>
                                        <td className="py-3 px-4 text-white text-right">
                                            {formatCurrency(solBalance * (solPrice || 0))}
                                        </td>
                                        <td className="py-3 px-4 text-white text-right">-</td>
                                    </tr>
                                )}
                                
                                {/* Display all filtered tokens (tokens with balance of more than 1)*/}
                                {filteredTokens.filter(token => token.tokenSymbol !== 'SOL').map((token) => {
                                    const isShowcaseToken = showcaseToken.length > 0 && token.mint === showcaseToken[0].mint;
                                    return (
                                        <tr key={token.mint} className="hover:bg-gray-600 border-b border-gray-500">
                                            <td className="py-3 px-4 text-white">
                                                <div>
                                                    <span className="font-medium">
                                                        {token.tokenName} (${token.tokenSymbol})
                                                    </span>
                                                    <div className="text-xs text-black-700 mt-1 break-all">{token.mint}</div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-white text-right">{token.balance.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-white text-right">
                                                {formatCurrency(getTokenUSDValue(token))}
                                            </td>
                                            <td className="py-3 px-4 text-white text-right">
                                                {/* {isShowcaseToken ?  */}
                                                    {/* // formatMarketCap(getTokenMarketCap(token.mint)) :  */}
                                                    -
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-white p-4">No Tokens</p>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-700 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Wallet Form - shown only when editing or adding */}
                {isEditingWallet && (
                    <div className="mb-6">
                        <AddWalletForm 
                            onSubmit={isDatabaseWallet ? handleEditWallet : handleAddWallet}
                            onCancel={() => setIsEditingWallet(false)}
                            initialData={{
                                wallet: walletAddress,
                                name: walletData.name || '',
                                tags: walletData.tags || ''
                            }}
                        />
                    </div>
                )}
                
                {/* Wallet Info Card */}
                <div className="bg-gray-500 p-5 rounded-lg mb-6">
                    {/* Header section with title and wallet management buttons */}
                    <div className="flex justify-between items-center mb-2">
                        {/* Wallet Name Section */}
                        <h1 className="text-3xl font-bold text-black">
                            {walletData.name || `${walletData.wallet.slice(0, 4)}...${walletData.wallet.slice(-5)}`}
                        </h1>
                        
                        {/* Wallet Management Buttons */}
                        <div className="flex space-x-2">
                            {isDatabaseWallet ? (
                                <>
                                    {/* Edit button */}
                                    <button 
                                        onClick={() => setIsEditingWallet(!isEditingWallet)} 
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl"
                                    >
                                        {isEditingWallet ? 'Cancel' : 'Edit'}
                                    </button>
                                    
                                    {/* Remove button */}
                                    <button 
                                        onClick={handleRemoveWallet} 
                                        className="bg-red-700 hover:bg-red-900 text-white font-bold py-2 px-4 rounded-xl"
                                    >
                                        Remove
                                    </button>
                                </>
                            ) : (
                                /* Add button */
                                <button 
                                    onClick={() => setIsEditingWallet(!isEditingWallet)} 
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl"
                                >
                                    {isEditingWallet ? 'Cancel' : 'Add to Saved Wallets'}
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {/* Tags Section - Using wallet storage format */}
                    <div className="flex flex-row justify-between">
                        {/* Tags display */}
                        <div className="flex flex-row space-x-2">
                            {(walletData.tags || '').split(',')
                                .filter(tag => tag.trim())
                                .map((tag, index) => (
                                    <span 
                                        key={index}
                                        className="bg-gray-700 px-2 py-1 rounded-full text-sm text-white"
                                    >
                                        {tag.trim()}
                                    </span>
                                ))}
                            {(!walletData.tags || !walletData.tags.trim()) && (
                                <span className="text-gray-400 text-sm">No tags</span>
                            )}
                        </div>
                        <div className="flex flex-row space-x-2">
                        </div>
                    </div>
                    
                    <div className="rounded-lg text-white mt-4">
                        {/* Clickable Wallet Address Section */}
                        <button
                            onClick={() => copyToClipboard(walletData.wallet)}
                            className="flex hover:bg-gray-700 transition-colors duration-300 p-2 rounded cursor-pointer group relative"
                            title="Click to copy wallet address"
                            type="button"
                        >
                            <div className="flex w-full items-center">
                                <p className="font-mono break-all font-semibold text-white">{walletData.wallet}</p>
                                <div className="transition-transform duration-300 ml-1 flex-shrink-0">
                                    {copyFeedback ? (
                                        <Check size={16} className="text-white" />
                                    ) : (
                                        <Copy size={16} className="text-white group-hover:scale-110" />
                                    )}
                                </div>
                            </div>
                            
                            {/* Copy feedback animation */}
                            <span 
                                className={`absolute right-0 -top-8 bg-gray-800 text-white px-2 py-1 rounded text-sm transition-opacity duration-300 ${
                                    copyFeedback ? 'opacity-100' : 'opacity-0'
                                }`}
                            >
                                Copied
                            </span>
                        </button>
                    </div>
                    {/* SOL Balance Section with USD value */}
                    {solBalance !== null && (
                        <div className="w-full max-w-2xl pt-4">
                            <h2 className="text-l font-bold">
                                SOL balance: {solBalance} 
                                {solPrice !== null && (
                                    <span className="ml-2 text-sm text-gray-200">
                                        (${(solBalance * solPrice).toFixed(2)} USD)
                                    </span>
                                )}
                            </h2>
                        </div>
                    )}
                </div>

                {/* Tabbed Interface Section */}
                <div className="bg-gray-500 p-5 rounded-lg mb-10">
                    <WalletTabs defaultTab="transactions">
                        <TabContent tab="holdings">
                            <h2 className="text-xl font-bold mb-4">Current Token Holdings</h2>
                            <TokenHoldings parentSolPrice={solPrice} />
                        </TabContent>
                        
                        <TabContent tab="transactions">
                            <h2 className="text-xl font-bold mb-4">Transaction History</h2>
                            <TransactionHistory walletAddress={walletAddress} />
                        </TabContent>
                    </WalletTabs>
                </div>
            </div>
        </div>
    );
}