// Types related to transaction history and processing

export type TransactionType = 'TOKEN_TRANSFER' | 'SWAP' | 'UNKNOWN';
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
  solChange?: number;
  solDirection?: TransferDirection;
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  cursor?: string;
}