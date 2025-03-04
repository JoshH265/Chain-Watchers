// src/app/types.ts
export interface Token {
    mint: string;
    amount: number;
    decimals: number;
}

export interface WalletBalanceResponse {
    nativeBalance: number;
    tokens: Token[];
}

export interface TokenMetadata {
    id: string;
    content: {
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

export interface HeliusMetadataResponse {
    jsonrpc: string;
    id: string;
    result: TokenMetadata[];
}

export interface TokenWithDetails {
    mint: string;
    tokenName: string;
    tokenSymbol: string;
    balance: number;
    decimals: number;
}

export interface Wallet {
    _id: string;
    wallet: string;
    name: string;
    tags: string;
}