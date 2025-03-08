'use client'

import React, { useEffect, useState } from 'react';
import AddWalletForm from '../../components/add-wallet-form';
import Link from 'next/link';
import {getWalletData} from '@/lib/api-client'; // Using path alias -- Testing 03/03/2025


// Define the structure for wallet data
interface Wallet {
  _id: string; // Unique identifier for the wallet
  wallet: string; // Wallet address
  name: string; // User-defined name for the wallet
  tags: string; // Comma-separated tags for categorization
}

// Main component for wallet management
const WalletStorage: React.FC = () => {
  // State management for wallet list and UI controls
  const [wallets, setWallets] = useState<Wallet[]>([]); // Stores all wallets
  const [isAddingWallet, setIsAddingWallet] = useState(false); // Controls add/edit form visibility
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null); // Stores wallet being edited
  const [solBalances, setSolBalances] = useState<{[key: string]: number}>({}); // Stores SOL balances for stored wallets

  // Fetches wallet list from the API
  const fetchWallets = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/wallet-storage`);
      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error Response:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setWallets(data);
      
      // Fetch all SOL balances in parallel
      const balancePromises = data.map((wallet: Wallet) => 
        getWalletData(wallet.wallet)
          .then(({ solBalance }) => ({
            wallet: wallet.wallet,
            balance: parseFloat(solBalance.toFixed(2))
          }))
          .catch(() => ({
            wallet: wallet.wallet,
            balance: 0
          }))
      );

      const balances = await Promise.all(balancePromises); // Collects balances all at once instead of looping a for each
      const balanceObject = balances.reduce((acc, { wallet, balance }) => ({
        ...acc,
        [wallet]: balance
      }), {});

      setSolBalances(balanceObject);
    } catch (_error) {
      console.error('Failed to fetch wallets:', _error);
    }
  };

  // Load wallets on component mounter
  useEffect(() => {
    fetchWallets();
  }, []);

  // Handles adding a new wallet to storage
  const handleAddWallet = async (formData: { wallet: string; name: string; tags: string }) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/wallet-storage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to add wallet');
      }

      fetchWallets();        // Refresh wallet list
      setIsAddingWallet(false);  // Hide the form
    } catch (_error) {
      console.error('Error adding wallet:', _error);
    }
  };

  // Handles updating an existing wallet
  const handleEditWallet = async (formData: { wallet: string; name: string; tags: string }) => {
    try {
      if (!editingWallet) return;

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/wallet-storage?id=${editingWallet._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to edit wallet');
      }

      fetchWallets(); // Refresh wallet list
      setEditingWallet(null); // Clear editing state
      setIsAddingWallet(false); // Hide the form
    } catch (_error) {
      console.error('Error editing wallet:', _error);
    }
  };

  // Handles wallet deletion
  const handleRemoveWallet = async (walletId: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/wallet-storage?id=${walletId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove wallet');
      }

      fetchWallets();  // Refresh wallet list
    } catch (_error) {
      console.error('Error removing wallet:', _error);
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

        {/* Conditional render of the add/edit wallet form */}
        {isAddingWallet && (
          <AddWalletForm 
            onSubmit={editingWallet ? handleEditWallet : handleAddWallet} 
            onCancel={() => {
              setIsAddingWallet(false);
              setEditingWallet(null);
            }} 
            initialData={editingWallet ? {
              wallet: editingWallet.wallet,
              name: editingWallet.name,
              tags: editingWallet.tags
            } : undefined}
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
                  Sol balance: {solBalances[wallet.wallet] || 'Loading...'}
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