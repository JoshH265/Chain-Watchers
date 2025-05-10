import axios from 'axios';
import dotenv from 'dotenv';
import { Helius } from 'helius-sdk';
import { Transaction, TokenTransfer, TransactionType, TokenInfo, TransactionHistoryOptions, TransactionHistoryResponse } from '../types/transactions.types';
import { solPriceService } from './sol-price-service';

// Load environment variables
dotenv.config();
const apiKey = process.env.HELIUS_API_KEY;
const heliusClient = new Helius(apiKey || '');

/**
 * Fetches transaction history for a wallet with pagination and date filtering
 * @param walletAddress Wallet address to fetch transactions for
 * @param options Options for filtering and pagination
 * @returns Array of transactions and optional cursor for pagination
 */
export async function getWalletTransactionHistory(
  walletAddress: string,
  options: TransactionHistoryOptions = {}
): Promise<TransactionHistoryResponse> {
  try {
    
    
    const requestedLimit = 20; // Default to 20 transactions displayed
    const batchSize = 50; // Always fetch at least 50 per API call

    let currentCursor = options.cursor; // Track pagination position
    let processedTransactions: Transaction[] = []; // Store processed transactions
    let lastRawTransaction: any = null; // Keep track of last transaction for cursor pagination
    
    // Pagination loop - keeps fetching until we have enough transactions or run out of data
    while (processedTransactions.length < requestedLimit) {
      // Prepare API query parameters using URLSearchParams
      const params = new URLSearchParams();
      params.append('api-key', apiKey || '');
      params.append('limit', batchSize.toString());
      
      // https://www.helius.dev/docs/das/pagination#cursor-based
      // Claude sonnet 
      if (currentCursor) { 
        // If cursor already exists, use last transaction signature as cursor
        params.append('before', currentCursor);
      } else if (options.before) {
        // If no cursor then start from latest transaction
        params.append('before', options.before);
      }
      
      // API URL with all  required params
      const url = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?${params.toString()}`;
      console.log('Fetching transactions from:', url); // logging for debugging
      
      // Make the API request to Helius
      const response = await axios.get(url);
      console.log('Helius API response status:', response.status);
      
      // Check response data
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Unexpected response format:', response.data);
        throw new Error('Invalid response format from Helius API');
      }
      
      // Exit loop when no more transactions
      if (response.data.length === 0) {
        break;
      }
      
      // Logging 
      console.log(`Received ${response.data.length} raw transactions from Helius API`);
      
      // Set default minimum thresholds for filtering out dust transactions
      const minSolAmount = options.minSolAmount !== undefined ? options.minSolAmount : 0.0001;
      const minTokenAmount = options.minTokenAmount !== undefined ? options.minTokenAmount : 0.001;
      
      const newProcessedTransactions = await processTransactions(response.data, walletAddress, {
        minSolAmount,
        minTokenAmount
      });
      
      // Store the last transaction for cursor pagination
      if (response.data.length > 0) {
        lastRawTransaction = response.data[response.data.length - 1];
      }
      // merge already processed with newly processed - into new array
      processedTransactions = [...processedTransactions, ...newProcessedTransactions];
      console.log(`Now have ${processedTransactions.length} valid transactions of ${requestedLimit} requested`);
      
      // Break loop if not enough transaction to fill batch
      if (response.data.length < batchSize) {
        break;
      }
      // Update cursor for next iteration based on last transaction signature
      currentCursor = lastRawTransaction?.signature;
      if (!currentCursor) {
        break;
      }
    }
    
    // Splits processed transaction array into new one with only the requested limit of transactions
    const FinalisedTransactions = processedTransactions.slice(0, requestedLimit);

    let nextCursor = undefined;
    // If more transaction than request then set the nextCursor to last sig to continue pagination
    if (lastRawTransaction && FinalisedTransactions.length === requestedLimit) {
      nextCursor = lastRawTransaction.signature;
    }
    
    console.log(`Returning ${FinalisedTransactions.length} transactions with ${nextCursor ? 'cursor' : 'no cursor'}`);
    
    // Return both the transactions and the cursor for next page
    return {
      transactions: FinalisedTransactions,
      cursor: nextCursor
    };
  } catch (error) {
    // Comprehensive error handling with detailed logging
    console.error('Error fetching transaction history:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', error.response?.data);
    }
    throw error; // Re-throw for higher-level error handling
  }
}

/**
 * Process transactions from the Helius REST API format to our app format
 * with USD value information based on SOL balance changes
 */
async function processTransactions(
  transactions: any[], 
  walletAddress: string,
  options = {
    minSolAmount: 0.0001,
    minTokenAmount: 0.001,
  }
): Promise<Transaction[]> {
  // Get current SOL price
  const solPriceUSD = await solPriceService.getCurrentSolPrice();
  console.log(`Using SOL price: $${solPriceUSD} for transaction calculations`);
  
  console.log(`Processing ${transactions.length} raw transactions with filters: minSol=${options.minSolAmount}, minToken=${options.minTokenAmount}`);
  let filteredCount = 0;
  
  const processedTransactions: Transaction[] = [];
  
  for (const tx of transactions) {
    try {
      // Skip transactions without proper data
      if (!tx.signature) {
        console.log('Skipping transaction without signature');
        continue;
      }
      
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
          
          // Get token symbol - use the one provided or fetch it
          let tokenSymbol = transfer.tokenSymbol;
          if (!tokenSymbol) {
            // If no symbol is provided, try to get it from Helius
            tokenSymbol = await extractTokenSymbol(transfer.mint, heliusClient);
          }
          
          // Create token transfer object
          const tokenTransfer = {
            tokenMint: transfer.mint,
            amount: transfer.tokenAmount,
            decimals: decimals,
            direction: isIncoming ? 'in' as const : 'out' as const,
            priceUSD: null,
            counterparty: isIncoming ? transfer.fromUserAccount : transfer.toUserAccount,
            tokenSymbol: tokenSymbol,
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
      if (!includeTransaction) {
        filteredCount++;
        continue;
      }
      
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

      // Calculate USD value based on SOL changes
      let valueUSD: number | null = null;

      // If swap with SOL/WSOL, use the SOL amount for value
      if (txType === 'SWAP') {
        // Check if SOL/WSOL is being received or sent
        const solToken = toToken?.symbol === 'SOL' || toToken?.symbol === 'WSOL' 
          ? toToken 
          : fromToken?.symbol === 'SOL' || fromToken?.symbol === 'WSOL' 
            ? fromToken 
            : null;
        
        if (solToken) {
          // Calculate based on SOL amount
          const solAmount = solToken.amount / Math.pow(10, solToken.decimals);
          valueUSD = solAmount * solPriceUSD;
          console.log(`Calculated USD value based on SOL amount: $${valueUSD}`);
        }
      }
      
      //For direct SOL transfers (so not trading or swapping but moving to and from wallets)
      if (!valueUSD && txType === 'TOKEN_TRANSFER') {
        const solTransfer = tokenTransfers.find(t => t.tokenSymbol === 'SOL');
        if (solTransfer) {
          const solAmount = solTransfer.amount / Math.pow(10, solTransfer.decimals);
          valueUSD = solAmount * solPriceUSD;
        }
      }
      
      // Create the transaction object
      processedTransactions.push({
        signature: tx.signature,
        timestamp: tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : new Date().toISOString(),
        fee: tx.fee || 0, // not being used anymore but too much hassle to remove everywehre
        type: txType,
        tokenTransfers,
        fromToken,
        toToken,
        valueUSD
      });
    } catch (err) {
      console.error(`Error processing transaction:`, err);
    }
  }
  
  console.log(`Filtered out ${filteredCount} transactions that didn't meet criteria`);
  return processedTransactions;
}

/**
 * Determines the transaction type based on its content and description
 */
function determineTransactionType(transaction: any): TransactionType {
  // If multiple token transfers or description includes swap, likely a swap
  if (
    (transaction.tokenTransfers && transaction.tokenTransfers.length > 1) ||
    (transaction.description && transaction.description.toLowerCase().includes('swap'))
  ) {
    return 'SWAP';
  }
  
  // Default to token transfer
  return 'TOKEN_TRANSFER';
}

/**
 * Extract a token symbol from mint address using Helius's getAsset method
 */
async function extractTokenSymbol(mint: string, heliusClient: any): Promise<string> {
  // Handle known tokens without API call for efficiency
  if (mint === 'So11111111111111111111111111111111111111112') {
    return 'SOL';
  }
  
  try {
    // Call Helius API to get the asset data
    const response = await heliusClient.rpc.getAsset({
      id: mint
    });
    
    // Extract symbol from response
    if (response && response.content && response.content.metadata && response.content.metadata.symbol) {
      return "$" + response.content.metadata.symbol;
    }
    
    // Fallback if no symbol is found
    return mint.substring(0, 4) + '...';
  } catch (error) {
    console.error(`Error fetching token symbol for ${mint}:`, error);
    // Fallback to shortened address on error
    return mint.substring(0, 4) + '...';
  }
}

// Export functions
export { processTransactions };