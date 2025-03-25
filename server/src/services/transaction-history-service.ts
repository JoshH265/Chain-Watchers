import axios from 'axios';
import dotenv from 'dotenv';
// import { Transaction, TokenTransfer, TransactionType, TokenInfo } from '../types/transactions.types';
import { Transaction, TokenTransfer, TransactionType, TransferDirection, TokenInfo } from '../types/transactions.types';

// Load environment variables
dotenv.config();
const apiKey = process.env.HELIUS_API_KEY;


/**
 * Fetches transaction history for a wallet with pagination and date filtering
 * @param walletAddress Wallet address to fetch transactions for
 * @param options Options for filtering and pagination
 * @returns Array of transactions and optional cursor for pagination
 */
export async function getWalletTransactionHistory(
  walletAddress: string,
  options: {
    limit?: number; // Number of transactions to fetch - IF there is a limit
    before?: string; // ISO date - not currently used
    after?: string; // ISO date  - not currently used
    cursor?: string;
    minSolAmount?: number; // Minimum SOL amount to include
    minTokenAmount?: number; // Minimum token amount to include
  } = {}
): Promise<{ // Fetches all transaction at once and returns them utilising Promise functionality
  transactions: Transaction[];
  cursor?: string;
}> {
  try {
    // Log API key for bebugging without exposing it
    console.log('HELIUS_API_KEY present:', !!apiKey);
    
    // Setups query parameters for API request
    const params = new URLSearchParams();
    params.append('api-key', apiKey || '');
    
    // If a limit is specified in options - add into query
    if (options.limit) {
      params.append('limit', options.limit.toString());
    }
    
    // Handle pagination parameters: - sets starting point for fetching transactions
    if (options.cursor) {
      params.append('before', options.cursor);
    }
    // If 'before' is specified instead of cursor
    else if (options.before) {
      params.append('before', options.before);
    }
    
    // Sets the starting point for fetching transactions IF specified
    if (options.after) {
      params.append('after', options.after);
    }
    
    // Use the REST API endpoint as shown in Helius documentation
    const url = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?${params.toString()}`;
    
    console.log('Fetching transactions from:', url);
    
    const response = await axios.get(url);
    console.log('Helius API response status:', response.status);
    
    if (!response.data || !Array.isArray(response.data)) {
      console.error('Unexpected response format:', response.data);
      throw new Error('Invalid response format from Helius API');
    }
    
    // Debug the first transaction format
    if (response.data.length > 0) {
      console.log('Sample transaction structure:', 
        JSON.stringify(response.data[0], null, 2).slice(0, 300) + '...');
    }
    
    // Set minimum thresholds for filtering
    const minSolAmount = options.minSolAmount !== undefined ? options.minSolAmount : 0.01;
    const minTokenAmount = options.minTokenAmount !== undefined ? options.minTokenAmount : 1;
    
    // Process the response data into our expected format with thresholds
    const processedTransactions = processTransactions(response.data, walletAddress, {
      minSolAmount,
      minTokenAmount
    });
    // Process the response data into our expected format
    console.log(`Processed ${processedTransactions.length} transactions`);
    
    // For cursor-based pagination, use the signature of the last transaction
    let nextCursor = undefined;
    if (processedTransactions.length > 0 && processedTransactions.length === options.limit) {
      nextCursor = processedTransactions[processedTransactions.length - 1].signature;
    }
    
    return {
      transactions: processedTransactions,
      cursor: nextCursor
    };
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', error.response?.data);
    }
    throw error;
  }
}

/**
 * Process transactions from the Helius REST API format to our app format
 * with improved token swap detection
 */
function processTransactions(
  transactions: any[], 
  walletAddress: string,
  options = {
    minSolAmount: 0.01,
    minTokenAmount: 1
  }
): Transaction[] {
  const processedTransactions: Transaction[] = [];
  
  for (const tx of transactions) {
    try {
      // Skip transactions without proper data
      if (!tx.signature) continue;
      
      // Extract all token transfers
      const tokenTransfers: TokenTransfer[] = [];
      let includeTransaction = false;
      
      // Arrays to collect incoming and outgoing transfers for this transaction
      const incomingTransfers: any[] = [];
      const outgoingTransfers: any[] = [];
      
      // Process token transfers
      if (tx.tokenTransfers && Array.isArray(tx.tokenTransfers)) {
        for (const transfer of tx.tokenTransfers) {
          // Skip invalid transfers
          if (!transfer.fromUserAccount || !transfer.toUserAccount) continue;
          
          // Determine if this transfer is incoming or outgoing relative to our wallet
          const isIncoming = transfer.toUserAccount === walletAddress;
          const isOutgoing = transfer.fromUserAccount === walletAddress;
          
          if (!isIncoming && !isOutgoing) continue; // Skip transfers not related to our wallet
          
          // Calculate actual token amount
          const decimals = transfer.decimals || 0;
          const actualAmount = transfer.tokenAmount / Math.pow(10, decimals);
          
          // Apply minimum threshold
          if (actualAmount < options.minTokenAmount) continue;
          
          // Create token transfer object
          const tokenTransfer = {
            tokenMint: transfer.mint,
            amount: transfer.tokenAmount,
            decimals: decimals,
            direction: isIncoming ? 'in' as const : 'out' as const,
            priceUSD: null,
            counterparty: isIncoming ? transfer.fromUserAccount : transfer.toUserAccount,
            tokenSymbol: transfer.tokenSymbol || extractTokenSymbol(transfer.mint),
            tokenName: transfer.tokenName || 'Unknown Token'
          };
          
          // Add to our arrays
          if (isIncoming) {
            incomingTransfers.push({...transfer, ...tokenTransfer});
          } else {
            outgoingTransfers.push({...transfer, ...tokenTransfer});
          }
          
          tokenTransfers.push(tokenTransfer);
          includeTransaction = true;
        }
      }
      
      // Process SOL transfers
      if (tx.nativeTransfers && Array.isArray(tx.nativeTransfers)) {
        for (const transfer of tx.nativeTransfers) {
          // Skip invalid transfers
          if (!transfer.fromUserAccount || !transfer.toUserAccount) continue;
          
          // Determine if this transfer is incoming or outgoing relative to our wallet
          const isIncoming = transfer.toUserAccount === walletAddress;
          const isOutgoing = transfer.fromUserAccount === walletAddress;
          
          if (!isIncoming && !isOutgoing) continue; // Skip transfers not related to our wallet
          
          // Calculate actual SOL amount
          const actualSolAmount = transfer.amount / 1_000_000_000;
          
          // Apply minimum threshold
          if (actualSolAmount < options.minSolAmount) continue;
          
          // Create token transfer object for SOL
          const solTransfer = {
            tokenMint: 'SOL',
            amount: transfer.amount,
            decimals: 9,
            direction: isIncoming ? 'in' as const : 'out' as const,
            priceUSD: null,
            counterparty: isIncoming ? transfer.fromUserAccount : transfer.toUserAccount,
            tokenSymbol: 'SOL',
            tokenName: 'Solana'
          };
          
          // Add to our arrays
          if (isIncoming) {
            incomingTransfers.push({...transfer, ...solTransfer});
          } else {
            outgoingTransfers.push({...transfer, ...solTransfer});
          }
          
          tokenTransfers.push(solTransfer);
          includeTransaction = true;
        }
      }
      
      // Skip transaction if it doesn't meet our criteria
      if (!includeTransaction) continue;
      
      // Determine transaction type
      const txType = determineTransactionType(tx);
      
      // Set fromToken and toToken based on our collected transfers
      let fromToken: TokenInfo | undefined = undefined;
      let toToken: TokenInfo | undefined = undefined;
      
      // For swaps and token transfers, we want to show what was sent OUT as FROM
      // and what was received IN as TO
      if (outgoingTransfers.length > 0) {
        const outTransfer = outgoingTransfers[0]; // Use the first outgoing transfer
        fromToken = {
          mint: outTransfer.tokenMint,
          symbol: outTransfer.tokenSymbol,
          amount: outTransfer.amount,
          decimals: outTransfer.decimals
        };
      }
      
      if (incomingTransfers.length > 0) {
        const inTransfer = incomingTransfers[0]; // Use the first incoming transfer
        toToken = {
          mint: inTransfer.tokenMint,
          symbol: inTransfer.tokenSymbol,
          amount: inTransfer.amount,
          decimals: inTransfer.decimals
        };
      }
      
      // Create the transaction object
      processedTransactions.push({
        signature: tx.signature,
        timestamp: tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : new Date().toISOString(),
        fee: tx.fee || 0,
        type: txType,
        tokenTransfers,
        fromToken,
        toToken
      });
    } catch (err) {
      console.error(`Error processing transaction:`, err);
    }
  }
  
  return processedTransactions;
}

/**
 * Extract a token symbol from mint address or metadata if available
 */
function extractTokenSymbol(mint: string): string {
  // Common known tokens could be added here
  if (mint === 'So11111111111111111111111111111111111111112') {
    return 'SOL';
  }
  
  // For unknown tokens, return shortened mint address
  return '$' + mint.substring(0, 4);
}

/**
 * Determine the type of transaction
 */
function determineTransactionType(transaction: any): TransactionType {
  // If multiple token transfers or native transfers involve our wallet, likely a swap
  if (
    (transaction.tokenTransfers && transaction.tokenTransfers.length > 1) ||
    (transaction.description && transaction.description.toLowerCase().includes('swap'))
  ) {
    return 'SWAP';
  }
  
  // Default to token transfer
  return 'TOKEN_TRANSFER';
}