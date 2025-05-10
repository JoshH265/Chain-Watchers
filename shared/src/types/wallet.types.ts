export interface WalletBalanceResponse {
  nativeBalance: number;
  tokens: Array<{
    mint: string;
    amount: number;
    decimals: number;
  }>;
}

export interface HeliusMetadataResponse {
  result: TokenMetadata[];
}

export interface TokenMetadata {
  id?: string;
  content?: {
    metadata?: {
      name?: string;
      symbol?: string;
    };
    json?: {
      name?: string;
      symbol?: string;
    };
  };
}

export interface Token {
  mint: string;
  amount: number;
  decimals: number;
}

export interface TokenWithDetails {
  mint: string;
  tokenName: string;
  tokenSymbol: string;
  balance: number;
  decimals: number;
}

export interface SearchResult {
  wallet: string;
  name?: string; // Name will be present if wallet is saved
  solBalance: number;
  lastActivity: string;
  isStored: boolean;
}
export interface Wallet {
  _id?: string;
  wallet: string;
  name?: string;
  tags?: string;
}