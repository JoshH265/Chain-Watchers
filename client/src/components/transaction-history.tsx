import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Transaction, TransactionHistoryResponse } from '../../../shared/src/types/transaction.types';

interface TransactionHistoryProps {
  walletAddress: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ walletAddress }) => {
  // Transaction data and state management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [pageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  // Token filers 
  const [minSolAmount, setMinSolAmount] = useState(0.01);
  const [minTokenAmount, setMinTokenAmount] = useState(1);

  // Time/Date based display toggle
  const [showRelativeTime, setShowRelativeTime] = useState(false);
  
  // Store cursors for each page to allow navigation back and forth
  const [pageCursors, setPageCursors] = useState<{[key: number]: string | null}>({
    0: null // First page has no cursor
  });

  // Fetch initial transactions & resets state when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      setCurrentPage(1);
      setPageCursors({ 0: null });
      fetchTransactionPage(1);
    }
  }, [walletAddress]);

  // Function to fetch a specific page of transactions - using the cursor paginationclient/src/components/transaction-history.tsx
  const fetchTransactionPage = async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      // Check if the page is already fetched and has a cursor
      const cursor = page > 1 ? pageCursors[page-1] : undefined;
      
      console.log(`Fetching page ${page} with cursor:`, cursor);
      
      // Fetch transactions from API utilising params
      const response = await axios.get<TransactionHistoryResponse>(
        `${API_URL}/api/transaction-history/transactions/${walletAddress}`,
        {
          params: {
            limit: pageSize,
            cursor: cursor,
            minSolAmount: minSolAmount,
            minTokenAmount: minTokenAmount
          }
        }
      );

      console.log(`Received ${response.data.transactions.length} transactions, cursor: ${response.data.cursor ? 'present' : 'none'}`);
      
      // Update transactions with new page data
      setTransactions(response.data.transactions);
      
      // Store cursor for next page if it exists
      if (response.data.cursor) {
        setPageCursors(prev => ({
          ...prev,
          [page]: response.data.cursor || null
        }));
        setHasNextPage(true);
      } else {
        setHasNextPage(false);
      }
      
      // Update previous page availability
      setHasPrevPage(page > 1);
      
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      setError('Failed to load transaction history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Navigation handlers for flicking between pages
  const goToNextPage = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchTransactionPage(nextPage);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      fetchTransactionPage(prevPage);
    }
  };

  // Format token amount with decimals
  const formatTokenAmount = (amount: number, decimals: number, symbol?: string): string => {
    const actualAmount = amount / Math.pow(10, decimals);
    if (symbol === 'SOL') { // Special case for SOL
      return actualAmount.toLocaleString('en-GB', {
        // Always show atleast and no more than 2 decimal places
        // This was 4 originally but changed to 2 for clarity
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    // Sets the maximum number of decimal places to 2 for all other tokens
    const maxDecimals = Math.min(decimals, 2);
    return actualAmount.toLocaleString('en-GB', {
      maximumFractionDigits: maxDecimals
    });
  };
  // Format transaction date
  const formatDate = (timestamp: string): string => {
    if (showRelativeTime) {
      return formatRelativeTime(timestamp);
    }
    return new Date(timestamp).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Format relative time (e.g. 5 minutes ago, 2 hours ago)
  // Claude assisted with building this function
  // Was a last minute addition that is common with other products and wanted to replicate
  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const txDate = new Date(timestamp);
    
    // Calcuates time difference in milliseconds
    const diffMs = now.getTime() - txDate.getTime();
    
    // Convert to appropriate units
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    // Return human-readable format based on the time difference
    if (diffSecs < 60) {
      return `${diffSecs} second${diffSecs !== 1 ? 's' : ''} ago`;
    }
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
      return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
    }
    
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
  };

  // Format USD value
  const formatUsdValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) {
      return '-';
    }
    return value.toLocaleString('en-GB', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).replace('US$', '$');
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
  if (transactions.length === 0 && !loading) {
    return <div className="p-4">No transaction history available.</div>;
  }

  return (
    <div className="w-full">
      <div className="mb-4 p-2 bg-gray-800 rounded flex justify-between items-center">
        <p className="text-sm text-gray-400">
          Page {currentPage} · {transactions.length} transactions
        </p>
        <div className="flex space-x-2">
          <button
            onClick={goToPrevPage}
            disabled={!hasPrevPage || loading}
            className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <button
            onClick={goToNextPage}
            disabled={!hasNextPage || loading}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 text-white">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setShowRelativeTime(false)}
                    className={`px-2 py-1 text-xs rounded ${
                      !showRelativeTime 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                    }`}
                    title="date and time"
                  >
                    Date
                  </button>
                  <button
                    onClick={() => setShowRelativeTime(true)}
                    className={`px-2 py-1 text-xs rounded ${
                      showRelativeTime 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                    }`}
                    title="time ago"
                  >
                    Time
                  </button>
                </div>
              </th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Sent</th>
              <th className="px-4 py-3 text-left">Received</th>
              <th className="px-4 py-3 text-right">Tx Value (USD)</th> 
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
                  {formatUsdValue(tx.valueUSD)}
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

      {/* Bottom pagination controls */}
      {(hasNextPage || hasPrevPage) && (
        <div className="flex justify-center mt-4 mb-8">
          <div className="flex space-x-2">
            <button
              onClick={goToPrevPage}
              disabled={!hasPrevPage || loading}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <span className="px-4 py-2 bg-gray-700 text-white rounded">
              Page {currentPage}
            </span>
            <button
              onClick={goToNextPage}
              disabled={!hasNextPage || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;