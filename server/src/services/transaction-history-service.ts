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
    }
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
 * https://www.helius.dev/docs
 * Claude Sonnet 3.7 - Utilised for initial build of this function and debugging
 * 
 * @param transactions Raw transaction data from Helius API
 * @param walletAddress The user's wallet address to filter transfers for
 * @param options Minimum thresholds to filter out "dust" transactions
 * @returns Processed transactions with additional metadata
 */
async function processTransactions(
  transactions: any[], 
  walletAddress: string,
  options = {
    minSolAmount: 0.0001,  // Minimum SOL amount to include (filters dust)
    minTokenAmount: 0.001, // Minimum token amount to include
  }
): Promise<Transaction[]> {
  // Fetch current SOL price for USD value calculations
  const solPriceUSD = await solPriceService.getCurrentSolPrice();
  
  console.log(`Processing ${transactions.length} raw transactions with filters: minSol=${options.minSolAmount}, minToken=${options.minTokenAmount}`);
  let filteredCount = 0;
  
  const processedTransactions: Transaction[] = [];
  
  // Process each transaction individually
  for (const tx of transactions) {
    try {
      // Validate transaction has required data
      if (!tx.signature) {
        console.log('Skipping transaction without signature');
        continue;
      }
      
      // Collections to track transfers in this transaction
      const tokenTransfers: TokenTransfer[] = [];
      let includeTransaction = false;
      
      // Track incoming/outgoing transfers separately to identify swap pairs
      const incomingTransfers: any[] = [];
      const outgoingTransfers: any[] = [];
      
      // SECTION 1: PROCESS TOKEN TRANSFERS (NON-SOL TOKENS)
      if (tx.tokenTransfers && Array.isArray(tx.tokenTransfers)) {
        for (const transfer of tx.tokenTransfers) {
          if (!transfer.fromUserAccount || !transfer.toUserAccount) continue;
          
          // Determine transfer direction relative to user's wallet
          const isIncoming = transfer.toUserAccount === walletAddress;
          const isOutgoing = transfer.fromUserAccount === walletAddress;
          
          if (!isIncoming && !isOutgoing) continue; // Skip irrelevant transfers
          
          // Convert raw token amount to actual amount using token decimals
          const decimals = transfer.decimals || 0;
          const actualAmount = transfer.tokenAmount / Math.pow(10, decimals);
          
          // Filter out dust transactions
          if (actualAmount < options.minTokenAmount) continue;
          
          // Resolve token symbol - use existing or fetch from blockchain
          let tokenSymbol = transfer.tokenSymbol;
          if (!tokenSymbol) {
            tokenSymbol = await extractTokenSymbol(transfer.mint, heliusClient);
          }
          
          // Create standardized token transfer record
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
          
          // Categorize by direction for later swap detection
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
      // Skip this transaction if no relevant transfers were found
      if (!includeTransaction) {
        filteredCount++;
        continue;
      }
      
      // Determine if this is a SWAP or TRANSFER transaction
      const txType = confirmedTransactionType(tx);
      
      // SECTION 3: IDENTIFY SOURCE AND DESTINATION TOKENS
      // For display purposes, identify what tokens were sent and received
      let fromToken: TokenInfo | undefined = undefined;
      let toToken: TokenInfo | undefined = undefined;
      
      // What the user sent OUT becomes the source (FROM) token
      if (outgoingTransfers.length > 0) {
        const outTransfer = outgoingTransfers[0]; // Use first outgoing transfer
        fromToken = {
          mint: outTransfer.tokenMint,
          symbol: outTransfer.tokenSymbol,
          amount: outTransfer.amount,
          decimals: outTransfer.decimals
        };
      }
      
      // What the user received IN becomes the destination (TO) token
      if (incomingTransfers.length > 0) {
        const inTransfer = incomingTransfers[0]; // Use first incoming transfer
        toToken = {
          mint: inTransfer.tokenMint,
          symbol: inTransfer.tokenSymbol,
          amount: inTransfer.amount,
          decimals: inTransfer.decimals
        };
      }

      // SECTION 4: CALCULATE USD VALUE
      let valueUSD: number | null = null;

      // For SWAP transactions involving SOL, calculate USD value
      if (txType === 'SWAP') {
        // Find if SOL was involved in the swap (sent or received)
        const solToken = toToken?.symbol === 'SOL' || toToken?.symbol === 'WSOL' 
          ? toToken 
          : fromToken?.symbol === 'SOL' || fromToken?.symbol === 'WSOL' 
            ? fromToken 
            : null;
        
        if (solToken) {
          // Convert raw SOL amount to actual SOL and multiply by current price
          const solAmount = solToken.amount / Math.pow(10, solToken.decimals);
          valueUSD = solAmount * solPriceUSD;
          console.log(`Calculated USD value based on SOL amount: $${valueUSD}`);
        }
      }
      
      // For direct SOL transfers between wallets
      if (!valueUSD && txType === 'TRANSFER') {
        const solTransfer = tokenTransfers.find(t => t.tokenSymbol === 'SOL');
        if (solTransfer) {
          const solAmount = solTransfer.amount / Math.pow(10, solTransfer.decimals);
          valueUSD = solAmount * solPriceUSD;
        }
      }
      
      // SECTION 5: CREATE FINAL TRANSACTION OBJECT
      processedTransactions.push({
        signature: tx.signature,
        timestamp: tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : new Date().toISOString(),
        fee: tx.fee || 0, // Legacy field, kept for compatibility
        type: txType,
        tokenTransfers,
        fromToken,
        toToken,
        valueUSD
      });
    } catch (err) {
      // Handle errors per transaction to prevent entire batch failure
      console.error(`Error processing transaction:`, err);
    }
  }
  
  console.log(`Filtered out ${filteredCount} transactions that didn't meet criteria`);
  return processedTransactions;
}



/**
 * Determines the transaction by action and/or description of Tx
 */
function confirmedTransactionType(transaction: any): TransactionType {
  // If multiple token transfers or description includes swap, likely a swap
  if (
    // If multiple token(s) transferred in same transction then marked as swap
    // Or if TX desc includes info
    (transaction.tokenTransfers && transaction.tokenTransfers.length > 1) ||
    (transaction.description && transaction.description.toLowerCase().includes('swap'))
  ) {
    return 'SWAP';
  }
  
  // Default to token transfer
  return 'TRANSFER';
}


// Extract a token symbol from mint address using  getAsset method via Helius
async function extractTokenSymbol(mint: string, heliusClient: any): Promise<string> {
  // Wrapped sol mint address - reduces API calls
  // Add more known tokens later date if needed
  if (mint === 'So11111111111111111111111111111111111111112') {
    return 'SOL';
  }
  
  try {
    // Call getAsset endpoint for token metadata
    // https://www.helius.dev/docs/api-reference/das/getasset#getasset 
    const response = await heliusClient.rpc.getAsset({
      id: mint
    });
    
    // Checck each property in response to find symbol and ensure it exists
    // Cant just check final - runtime error
    if (response && response.content && response.content.metadata && response.content.metadata.symbol) {
      // return symbol and add $ prefix for consistency
      return "$" + response.content.metadata.symbol;
    }
    
    // Fallback if cant find, use shorthand of address
    return mint.substring(0, 4) + '...';
  } catch (error) {
    console.error(`Error fetching token symbol for ${mint}:`, error);
    // Fallback
    return mint.substring(0, 4) + '...';
  }
}

// Export functions
export { processTransactions };