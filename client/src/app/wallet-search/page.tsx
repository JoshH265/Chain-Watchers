'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTokenMetadata, getWalletdata, getStoredWallets, getTransactionHistory } from '@/lib/api-client';
import { TokenMetadata, Token, TokenWithDetails, Wallet, SearchResult } from '../../../../shared/src/types/wallet.types';


const WalletSearch: React.FC = () => {
    const [walletAddress, setWalletAddress] = useState('');
    const [tokens, setTokens] = useState<TokenWithDetails[]>([]);
    const [solBalance, setSolBalance] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [storedWallets, setStoredWallets] = useState<Wallet[]>([]);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        // Focus the input when component loads
        if (inputRef.current) {
            inputRef.current.focus();
        }
        
        // Load search history from localStorage
        const history = localStorage.getItem('walletSearchHistory');
        if (history) {
            setSearchHistory(JSON.parse(history));
        }
        
        // Fetch stored wallets
        const fetchStoredWallets = async () => {
            try {
                const wallets = await getStoredWallets();
                setStoredWallets(wallets);
            } catch (error) {
                console.error("Error fetching stored wallets:", error);
            }
        };
        
        fetchStoredWallets();
    }, []);

    // Check if wallet pattern is valid 
    // https://solana.com/developers/cookbook/wallets/create-keypair
    // Solana wallets use base58 encoding
    const isValidWalletPattern = (address: string) => {
        return /^[A-HJ-NP-Za-km-z1-9]{32,44}$/.test(address);
    };

    // Add to search history
    const addToSearchHistory = (wallet: string) => {
        const updatedHistory = [
            wallet, 
            ...searchHistory.filter(item => item !== wallet)
        ].slice(0, 5); // Keeps last 5 searches
        
        setSearchHistory(updatedHistory);
        localStorage.setItem('walletSearchHistory', JSON.stringify(updatedHistory));
    };

    // Handle input change with auto-search
    // https://stackoverflow.com/questions/40676343/typescript-input-onchange-event-target-value
    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setWalletAddress(value);
        
        // Clear previous results
        if (!value) { setSearchResult(null); setShowDropdown(false); setTokens([]); setSolBalance(null);
            return;
        }
        
        // Check if input looks like a valid wallet address
        if (isValidWalletPattern(value)) {
            await handleSearch(value);
        } else {
            setSearchResult(null);
            setShowDropdown(false);
        }
    };

    const handleSearch = async (address: string = walletAddress) => {
        if (!address) {
            alert('Please enter a wallet address');
            return;
        }
    
        setIsSearching(true);
        setError(null);
    
        try {
            const { solBalance } = await getWalletdata(address);
    
            setSolBalance(parseFloat(solBalance.toFixed(2)));
            
            // Check if wallet exists in stored wallets
            const storedWallet = storedWallets.find(w => w.wallet === address);
            
            // Get last activity from transaction history
            let lastActivity = 'N/A';
            try {
                const txHistory = await getTransactionHistory(address, { limit: 1 });
                
                const transactions = txHistory.transactions || [];
                
                if (transactions && transactions.length > 0) {
                    const timestamp = new Date(Number(transactions[0].timestamp) * 1000);
                    lastActivity = timestamp.toLocaleDateString();
                }
            } catch (err) {
                console.error("Error fetching transaction history:", err);
            }
                        
            // Create search result for dropdown
            setSearchResult({
                wallet: address,
                name: storedWallet?.name,
                solBalance: parseFloat(solBalance.toFixed(3)),
                lastActivity,
                isStored: !!storedWallet
            });
            
            setShowDropdown(true);
    
    
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to fetch tokens');
            setTokens([]);
            setSolBalance(null);
            setSearchResult(null);
            setShowDropdown(false);
        } finally {
            setIsSearching(false);
        }
    };

    // Handle wallet selection from dropdown
    const handleWalletSelect = (wallet: string) => {
        // Add to search history
        addToSearchHistory(wallet);
        
        // Navigate to wallet profile
        router.push(`/wallet-profile/${wallet}`);
    };

    // Handle search history selection
    const handleHistorySelect = (wallet: string) => {
        setWalletAddress(wallet);
        handleSearch(wallet);
        router.push(`/wallet-profile/${wallet}`);

    };

    return (
        <div className="min-h-screen flex flex-col items-center py-10 bg-gray-700">
            <h1 className="text-3xl font-bold mb-8 text-white">Wallet Search</h1>
            
            <div className="w-full max-w-md relative">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Enter wallet address"
                    value={walletAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded mb-4"
                />
                
                {isSearching && (
                    <div className="absolute right-3 top-2.5 text-blue-500">
                        {/* This SVG section was suggested by Copilot completely, to indicate a search */}
                        <svg 
                            className="animate-spin h-5 w-5 text-blue-500"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                        >
                            <path
                                fill="currentColor"
                                d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm1.5 17.5h-3v-3h3zm0-4.5h-3V7h3z"
                            />
                        </svg>
                    </div>
                )}
                
                {/* Search Results Dropdown */}
                {showDropdown && searchResult && (
                    <div className="absolute w-full mt-1 bg-white rounded-md shadow-lg z-10">
                        <div 
                            className="p-3 border-b cursor-pointer hover:bg-gray-100"
                            onClick={() => handleWalletSelect(searchResult.wallet)}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <div className="font-medium">
                                    {searchResult.name || 
                                     `${searchResult.wallet.slice(0, 4)}...${searchResult.wallet.slice(-5)}`}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {searchResult.isStored ? '(Saved)' : ''}
                                </div>
                            </div>
                            <div className="text-sm text-gray-600 break-all">{searchResult.wallet}</div>
                            <div className="flex justify-between mt-2 text-sm">
                                <div>SOL Balance: {searchResult.solBalance}</div>
                                <div>Last Activity: {searchResult.lastActivity}</div>
                            </div>
                        </div>
                    </div>
                )}
                
                {error && !showDropdown && (
                    <div className="absolute w-full mt-1 bg-red-100 text-red-700 p-2 rounded-md">
                        {error}
                    </div>
                )}
            </div>
            <div className="pt-10 mt-10 w-full max-w-md"></div>
            {/* Search History */}
            {searchHistory.length > 0 && (
                <div className="pt-10 mt-10 w-full max-w-md">
                    <h2 className="text-xl font-bold mb-2 text-white">Recent Searches</h2>
                    <div className="bg-gray-800 rounded-md overflow-hidden">
                        {searchHistory.map((wallet, index) => {
                            const storedWallet = storedWallets.find(w => w.wallet === wallet);
                            const displayName = storedWallet?.name || 
                                               `${wallet.slice(0, 4)}...${wallet.slice(-5)}`;
                            
                            return (
                                <div 
                                    key={index}
                                    className="p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-700 text-white flex justify-between"
                                    onClick={() => handleHistorySelect(wallet)}
                                >
                                    <div className="font-medium">{displayName}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalletSearch;