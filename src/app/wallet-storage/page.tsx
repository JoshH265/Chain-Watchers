'use client'

import React, { useEffect, useState } from 'react';

interface Wallet {
  _id: string;
  wallet: string;
  name: string;
  tags: string;
}

interface WalletFormData {
  wallet: string;
  name: string;
  tags: string;
}

const WalletStorage: React.FC = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [formData, setFormData] = useState<WalletFormData>({
    wallet: '',
    name: '',
    tags: ''
  });

  const fetchWallets = async () => {
    try {
      setLoading(true);
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
      setError(error instanceof Error ? error.message : 'Failed to fetch wallets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      setFormData({ wallet: '', name: '', tags: '' });
      setIsAddingWallet(false);
      fetchWallets();
    } catch (error) {
      console.error('Error adding wallet:', error);
      setError(error instanceof Error ? error.message : 'Failed to add wallet');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-700">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-700 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Wallet Storage</h1>
          <button 
            onClick={() => setIsAddingWallet(!isAddingWallet)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl"
          >
            {isAddingWallet ? 'Cancel' : 'Add Wallet'}
          </button>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {isAddingWallet && (
          <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-white mb-2">Wallet Address</label>
                <input
                  type="text"
                  name="wallet"
                  value={formData.wallet}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                  placeholder="Separate tags with commas"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Save Wallet
              </button>
            </div>
          </form>
        )}

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

        {wallets.length === 0 && !loading && (
          <div className="text-center text-gray-400 mt-8">
            No wallets found. Add your first wallet using the button above.
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletStorage;