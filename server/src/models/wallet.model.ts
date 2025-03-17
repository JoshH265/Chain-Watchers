import clientPromise from '../lib/db';
import { Token, Wallet } from '../types/wallet.types';

/**
 * Save wallet data to the database
 */
export async function saveWalletData(data: {
  address: string;
  solBalance: number;
  tokens: any[];
}): Promise<Wallet> {
  const client = await clientPromise;
  const db = client.db();
  
  // Process tokens to match our model format
  const processedTokens = data.tokens.map(token => ({
    mint: token.mint,
    tokenName: token.tokenName || 'Unknown',
    tokenSymbol: token.tokenSymbol || '???',
    balance: token.amount / Math.pow(10, token.decimals),
    decimals: token.decimals
  }));
  
  const wallet: Wallet = {
    address: data.address,
    solBalance: data.solBalance,
    tokens: processedTokens,
    lastUpdated: new Date()
  };
  
  // Update or insert the wallet document
  await db.collection('wallets').updateOne(
    { address: data.address },
    { $set: wallet },
    { upsert: true }
  );
  
  return wallet;
}

/**
 * Retrieve a wallet by its address
 */
export async function getWalletByAddress(address: string): Promise<Wallet | null> {
  const client = await clientPromise;
  const db = client.db();
  
  return await db.collection('wallets').findOne<Wallet>({ address });
}