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
    // If you're not sure, you can use a generic type:
    [key: string]: any;
  }
  
  export interface HeliusMetadataResponse {
    result: TokenMetadata[];
    // Add other properties as needed
  }

  export interface Token {
    mint: string;
    tokenName: string;
    tokenSymbol: string;
    balance: number;
    decimals: number;
  }
  
  export interface Wallet {
    address: string;
    solBalance: number; 
    tokens: Token[];
    lastUpdated: Date;
  }

