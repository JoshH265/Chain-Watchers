'use client'

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';

interface Wallet {
  _id: string;
  wallet: string;
  name: string;
  tags: string;
}

const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      // Optionally add some feedback that it was copied
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
};

export default function WalletProfile() {
  const params = useParams();
  const walletAddress = params.wallet as string;
  const [walletData, setWalletData] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/wallet-profile/${walletAddress}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch wallet data');
        }
        
        const data = await response.json();
        setWalletData(data);
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

  return (
    <div className="min-h-screen bg-gray-700 p-8">
      <div className="max-w-4xl mx-auto bg-gray-500 p-5 rounded-lg">
        <h1 className="text-3xl font-bold text-white mb">
          {walletData.name}
        </h1>
        <div className="rounded-lg text-white">
          <div className="flex items-center space-x-2">
            <p className="font-mono break-all">{walletData.wallet}</p>
            <button 
              onClick={() => copyToClipboard(walletData.wallet)}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              title="Copy wallet address"
              type="button"
            >
              <Copy size={16} className="text-white" />
            </button>
          </div>
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
      </div>
    </div>
  );
}