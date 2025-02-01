'use client'

import React, { useEffect, useState } from 'react';
import AddWalletForm from '../../components/add-wallet-form';

// Define the Wallet interface
interface Wallet {
  _id: string;
  wallet: string;
  name: string;
  tags: string;
}

const WalletStorage: React.FC = () => {
  // State to store the list of wallets
  const [wallets, setWallets] = useState<Wallet[]>([]);
  // State to manage the visibility of the add wallet form
  const [isAddingWallet, setIsAddingWallet] = useState(false);

  // Function to fetch wallets from the API
  const fetchWallets = async () => {
    try {
      const response = await fetch('/api/wallet-storage');
      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error Response:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setWallets(data);
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
    }
  };

  // Fetch wallets when the component mounts
  useEffect(() => {
    fetchWallets();
  }, []);

  // Function to handle adding a new wallet
  const handleAddWallet = async (formData: { wallet: string; name: string; tags: string }) => {
    try {
      const response = await fetch('/api/wallet-storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to add wallet');
      }

      // Refresh the wallet list after adding a new wallet
      fetchWallets();
      setIsAddingWallet(false);
    } catch (error) {
      console.error('Error adding wallet:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-700 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Wallet Storage</h1>
          {/* Button to toggle the add wallet form */}
          <button 
            onClick={() => setIsAddingWallet(!isAddingWallet)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl"
          >
            {isAddingWallet ? 'Cancel' : 'Add Wallet'}
          </button>
        </div>

        {/* Render the add wallet form if isAddingWallet is true */}
        {isAddingWallet && (
          <AddWalletForm onSubmit={handleAddWallet} onCancel={() => setIsAddingWallet(false)} />
        )}

        {/* Display the list of wallets */}
        <div className="space-y-4">
          {wallets.map((wallet) => (
            <div 
              key={wallet._id} 
              className="bg-gray-800 p-6 rounded-lg shadow-lg"
            >
              <div className="text-white space-y-2">
                <p>{wallet.name}</p>
                <p className="font-mono break-all">{wallet.wallet}</p>
                <p className="text-sm text-gray-400 mt-4">Tags</p>
                <div className="flex flex-wrap gap-2">
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
              </div>
            </div>
          ))}
        </div>

        {/* Display a message if no wallets are found */}
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