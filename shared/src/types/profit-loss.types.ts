export interface TokenProfitLoss {
    tokenMint: string;         // Unique token identifier
    tokenName: string;         // Human-readable token name
    tokenSymbol: string;       // Token symbol for display
    
    // Current holdings information
    currentBalance: number;    // Current token balance
    currentPriceUSD: number | null;  // Current price (if available)
    currentValueUSD: number | null;  // Current total value
    
    // Cost basis information
    totalAcquired: number;     // Total amount of tokens acquired
    totalAcquisitionCostUSD: number;  // Total cost in USD
    averageCostBasis: number;  // Average cost per token
    
    // Realized P/L (from selling)
    totalSold: number;         // Total amount of tokens sold
    totalSalesProceedsUSD: number;  // Total USD received from sales
    realizedProfitLossUSD: number;  // Profit/loss from completed sales
    
    // Unrealized P/L (from current holdings)
    unrealizedProfitLossUSD: number | null;  // Potential profit/loss
    
    // Total P/L
    totalProfitLossUSD: number | null;  // Combined realized + unrealized
    
    // ROI percentage
    roiPercentage: number | null;  // Return on investment percentage
  }
  export interface WalletProfitLoss {
    address: string;  // Wallet address
    totalRealizedProfitLossUSD: number;  // Sum of all realized P/L
    totalUnrealizedProfitLossUSD: number | null;  // Sum of all unrealized P/L
    totalProfitLossUSD: number | null;  // Total combined P/L
    tokens: TokenProfitLoss[];  // P/L data for individual tokens
    lastUpdated: string;  // Timestamp of calculation
  }