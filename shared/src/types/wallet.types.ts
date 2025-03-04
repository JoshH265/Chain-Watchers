export interface WalletBalanceResponse {
  nativeBalance: number;
  tokens: Array<{
    mint: string;
    amount: number;
    decimals: number;
    // Add other properties as needed
  }>;
}

export interface TokenMetadata {
  // Add properties based on your existing type
}

export interface HeliusMetadataResponse {
  result: TokenMetadata[];
  // Add other properties as needed
}