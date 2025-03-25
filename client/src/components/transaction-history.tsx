import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Transaction, TransactionHistoryResponse } from '../../../shared/src/types/transaction.types';

interface TransactionHistoryProps {
  walletAddress: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ walletAddress }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [minSolAmount, setMinSolAmount] = useState(0.01);
  const [minTokenAmount, setMinTokenAmount] = useState(1);

  // Fetch initial transactions
  useEffect(() => {
    if (walletAddress) {
      fetchTransactions();
    }
  }, [walletAddress]);

  // Function to fetch transactions
  const fetchTransactions = async (loadMore = false) => {
    if (!loadMore) {
      setLoading(true);
      setError(null);
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await axios.get<TransactionHistoryResponse>(
        `${API_URL}/api/transaction-history/transactions/${walletAddress}`,
        {
          params: {
            limit: 20,
            cursor: loadMore ? cursor : undefined,
            minSolAmount: minSolAmount,
            minTokenAmount: minTokenAmount
          }
        }
      );

      if (loadMore) {
        setTransactions(prev => [...prev, ...response.data.transactions]);
      } else {
        setTransactions(response.data.transactions);
      }

      // Update cursor for pagination
      setCursor(response.data.cursor);
      
      // Check if there are more transactions to load
      setHasMore(!!response.data.cursor);
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      setError('Failed to load transaction history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Format token amount with decimals
  const formatTokenAmount = (amount: number, decimals: number, symbol?: string): string => {
    // Calculate the actual amount
    const actualAmount = amount / Math.pow(10, decimals);
    
    // For SOL, use 2 decimal places
    if (symbol === 'SOL') {
      return actualAmount.toLocaleString('en-GB', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4
      });
    }
    
    // For other tokens, limit to a reasonable number of decimals (e.g., 4)
    const maxDecimals = Math.min(decimals, 4);
    return actualAmount.toLocaleString('en-GB', {
      maximumFractionDigits: maxDecimals
    });
  };

  // Format transaction date
  const formatDate = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format token display
  const formatTokenDisplay = (token: { mint: string, symbol?: string, amount: number, decimals: number } | undefined): string => {
    if (!token) return '-';
    
    const formattedAmount = formatTokenAmount(token.amount, token.decimals, token.symbol);
    const symbol = token.symbol || token.mint.substring(0, 4) + '...';
    
    return `${formattedAmount} ${symbol}`;
  };

  if (loading && transactions.length === 0) {
    return <div className="flex justify-center p-8">Loading transaction history...</div>;
  }

  if (error && transactions.length === 0) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (transactions.length === 0) {
    return <div className="p-4">No transaction history available.</div>;
  }

  return (
    <div className="w-full">
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 text-white">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Swapped</th>
              <th className="px-4 py-3 text-left">Recieved</th>
              <th className="px-4 py-3 text-right">Fee (SOL)</th>
              <th className="px-4 py-3 text-right">Transaction</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.signature} className="border-t border-gray-700">
                <td className="px-4 py-3">{formatDate(tx.timestamp)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    tx.type === 'SWAP' 
                      ? 'bg-purple-700 text-purple-100' 
                      : tx.type === 'TOKEN_TRANSFER' 
                        ? 'bg-blue-700 text-blue-100' 
                        : 'bg-gray-600 text-gray-300'
                  }`}>
                    {tx.type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {formatTokenDisplay(tx.fromToken)}
                </td>
                <td className="px- py-3">
                  {formatTokenDisplay(tx.toToken)}
                </td>
                <td className="px-4 py-3 text-right">
                  {(tx.fee / 1e9).toFixed(6)}
                </td>
                <td className="px-4 py-3 text-right">
                  <a 
                    href={`https://solscan.io/tx/${tx.signature}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {tx.signature.slice(0, 6)}...{tx.signature.slice(-4)}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center mt-4 mb-8">
          <button
            onClick={() => fetchTransactions(true)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;