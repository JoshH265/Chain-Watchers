// Types related to transaction history and processing

export type TransactionType = 'TRANSFER' | 'SWAP' | 'UNKNOWN';
export type TransferDirection = 'in' | 'out';  // Explicitly define direction as a union type

export interface TokenTransfer {
  tokenMint: string;
  amount: number;
  decimals: number;
  direction: TransferDirection;  // Use the union type here
  priceUSD: number | null;
  counterparty: string | null;
  tokenSymbol?: string;
  tokenName?: string;
}

export interface TokenInfo {
  mint: string;
  symbol?: string;
  amount: number;
  decimals: number;
}

export interface Transaction {
  signature: string;
  timestamp: string;
  fee: number;
  type: TransactionType;
  tokenTransfers: TokenTransfer[];
  fromToken?: TokenInfo;  // Use the TokenInfo interface
  toToken?: TokenInfo;    // Use the TokenInfo interface
  valueUSD?: number | null;  // Testing for getting the USD value of transactions
  solChange?: number;
  solDirection?: TransferDirection;
}

// New interface for the options parameter
export interface TransactionHistoryOptions {
  limit?: number;           
  before?: string;          
  after?: string;           
  cursor?: string;          
  minSolAmount?: number;    
  minTokenAmount?: number; 
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  cursor?: string;
}

export interface WalletToken {
  mint: string;
  balance: number; 
  decimals: number;
  tokenName: string;
  tokenSymbol: string;
}

export interface TokenMetadata {
  // Add properties based on your existing type
}

export interface HeliusMetadataResponse {
  result: TokenMetadata[];
  // Add other properties as needed
}