'use client'

import React, { useEffect, useState } from 'react';
import AddWalletForm from '../../components/add-wallet-form';
import Link from 'next/link';
import { Wallet } from '@/types/types'; // Import interfaces from centralized types file - testing 14/03
import { getWalletData, getStoredWallets, addWalletToDatabase, updateWalletInDatabase, removeWalletFromDatabase } from '@/lib/api-client';

// Main component for wallet management
const WalletStorage: React.FC = () => {

  // State management for wallet list and UI controls
  const [wallets, setWallets] = useState<Wallet[]>([]); // Stores all wallets
  const [isAddingWallet, setIsAddingWallet] = useState(false); // Controls add/edit form visibility
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null); // Stores wallet being edited
  const [solBalances, setSolBalances] = useState<{[key: string]: number}>({}); // Maps wallet addresses to repsective SOL balance

  // Fetches wallet list 
  const fetchWallets = async () => {
    try {
      // Get stored wallets from database
      const data = await getStoredWallets();
      setWallets(data);
      
      // Create an array of promises to fetch SOL balances for all wallets
      const balancePromises = data.map((wallet: Wallet) => 
        getWalletData(wallet.wallet) // Send blockchain address to API to get current balance
          .then(({ solBalance }) => ({ // Extract ONLY solBalance property from the API via destructuring
            wallet: wallet.wallet, // Save BLOCKCHAIN address for later matching with its balance
            balance: parseFloat(solBalance.toFixed(2)) // Convert balance to number with 2 decimal places
          }))
          .catch(() => ({
            walletAddress: wallet.wallet, // Keep same address format even when error occurs
            balance: 0 // Default to zero balance if API call fails
          }))
      );

      // Wait for all balance fetch to complete 
      const balances = await Promise.all(balancePromises); 
      
      // Converts array of balance objects to lookup object
      const balanceObject = balances.reduce((acc, { wallet, balance }) => ({
        ...acc,
        [wallet]: balance // Create key-value pairs of wallet address:balance
      }), {});

      // Update state with all balances at once
      setSolBalances(balanceObject);
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
    }
  };

  // Load wallets on component mount
  useEffect(() => {
    fetchWallets();
  }, []);

  const handleAddWallet = async (formData: { wallet: string; name: string; tags: string }) => {
    try {
      // Send form data to API client
      await addWalletToDatabase(formData);
      fetchWallets();
      
      setIsAddingWallet(false); // Hides form after submission
    } catch (error) {
      console.error('Error adding wallet:', error);
    }
  };

  const handleEditWallet = async (formData: { wallet: string; name: string; tags: string }) => {
    try {
      // Check if there is a wallet being edited
      if (!editingWallet) return;
      
      // Call API client to update wallet
      await updateWalletInDatabase(editingWallet._id, formData);
      fetchWallets();
      
      // After wallet update submission
      setEditingWallet(null); // Set editing wallet to null
      setIsAddingWallet(false); // Hide form
    } catch (error) {
      console.error('Error editing wallet:', error);
      // Could add user-facing error notification here
    }
  };

  const handleRemoveWallet = async (walletId: string) => {
    try {
      // Call API client to remove wallet
      await removeWalletFromDatabase(walletId);
      fetchWallets();

    } catch (error) {
      console.error('Error removing wallet:', error);
    }
  };

  return (
    // Main container with dark theme
    <div className="min-h-screen bg-gray-700 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header section with title and add wallet button */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Wallet Storage</h1>
          <button 
            onClick={() => {
              setIsAddingWallet(!isAddingWallet);
              setEditingWallet(null);
            }}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl"
          >
            {isAddingWallet ? 'Cancel' : 'Add Wallet'}
          </button>
        </div>

        {/* Conditional for wallet form based on isAddingWallet state */}
        {isAddingWallet && (
          <AddWalletForm 
            onSubmit={editingWallet ? handleEditWallet : handleAddWallet} // Choose handler based on mode Editing vs Adding
            onCancel={() => {
              setIsAddingWallet(false); // Hide form when cancelled (reverses the conditional)
              setEditingWallet(null); // Wipes any data that is being edited
            }} 
            initialData={editingWallet ? { // Pre-populate form with existing database data when editing
              wallet: editingWallet.wallet,
              name: editingWallet.name,
              tags: editingWallet.tags
            } : undefined} // used if there is no data to pre-populate
          />
        )}

        {/* Wallet list section */}
        <div className="space-y-4">
          {wallets.map((wallet) => (
            <div 
              key={wallet._id} 
              className="bg-gray-800 p-6 rounded-lg shadow-lg"
            >
              <div className="text-white space-y-2">
                {/* Wallet name with link to detailed profile */}
                <div className="flex flex-row justify-between">
                <Link
                  href={`/wallet-profile/${wallet.wallet}`}
                  className="text-blue-500 hover:underline"
                >

                  <p>{wallet.name}</p>
                </Link>
                <h2 className="text-l font-bold">
                  Sol balance: {solBalances[wallet.wallet] || 'Loading...'} {/* Display balance or fallback */}
                </h2>
                </div>
                {/* Wallet address display */}
                <p className="font-mono break-all">{wallet.wallet}</p>
                <p className="text-sm text-gray-400 mt-4">Tags</p>
                <div className="flex flex-row justify-between">
                  {/* Tags display */}
                  <div className="flex flex-row space-x-2">
                    {(wallet.tags || '').split(',')
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
                  {/* Action buttons for edit and remove */}
                  <div className="flex flex-row space-x-2">
                    <div className="bg-gray-700 px-2 py-1 rounded-full text-sm">
                      <button onClick={() => {
                        setIsAddingWallet(true);
                        setEditingWallet(wallet);
                      }}>Edit</button>
                    </div>
                    <div className="bg-red-700 px-2 py-1 rounded-full text-sm">
                      <button onClick={() => handleRemoveWallet(wallet._id)}>Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state message */}
        {wallets.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            No wallets found. Add your first wallet using the button above.
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletStorage;