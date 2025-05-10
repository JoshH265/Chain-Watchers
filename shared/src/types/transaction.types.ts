// Types related to transaction history and processing
export type TransactionType = 'TOKEN_TRANSFER' | 'SWAP' | 'UNKNOWN';
export type TransferDirection = 'in' | 'out';  // define direction of transaction

export interface TokenTransfer {
  tokenMint: string; // Token mint address
  amount: number; // amount of X token
  decimals: number; // decimal places for X token
  direction: TransferDirection;  // direction of transaction
  priceUSD: number | null; // Future use for working out USD value of tokens at the time of transaction
  counterparty: string | null; 
  tokenSymbol?: string; // Token symbol i.e. SOL, USDC, BTC
  tokenName?: string; // Full token name (if needed)
}

export interface TokenInfo {
  mint: string; // Mint address of tokens
  symbol?: string; 
  amount: number; 
  decimals: number; 
}

export interface Transaction {
  signature: string; // Signature of transaction
  timestamp: string; // Time of transaction
  type: TransactionType; // line 2 reference
  tokenTransfers: TokenTransfer[]; // line 5 reference - movement of tokens in transaction

  // Used for displaying what tokens are being swapped to/from the tracked/checked wallet
  fromToken?: TokenInfo; 
  toToken?: TokenInfo;

  valueUSD?: number | null;  // Testing for getting the USD value of transactions
  // Not currently needed but can be used for tracking sol balance changes per transactions
  // solChange?: number;
  // solDirection?: TransferDirection;
}

export interface TransactionHistoryResponse {
  transactions: Transaction[]; // Array of transaction objects
  cursor?: string;
}


