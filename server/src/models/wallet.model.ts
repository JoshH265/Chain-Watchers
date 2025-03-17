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
  const db = client.db("cached_tokens"); // Specify the database name here
  
  // Process tokens to save
  const processedTokens = data.tokens.map(token => ({
    mint: token.mint,
    tokenName: token.tokenName || 'Unknown',
    tokenSymbol: token.tokenSymbol || '?',
    balance: token.amount / Math.pow(10, token.decimals),
    decimals: token.decimals
  }));
  
  const wallet: Wallet = {
    address: data.address,
    solBalance: data.solBalance,
    tokens: processedTokens,
    lastUpdated: new Date()
  };
  
  // Update or create the blockchain_data document
  await db.collection('blockchain_data').updateOne(
    { address: data.address }, // search for matching wallet to what is being processed
    { $set: wallet }, // instructions to update field with new values FROM newly created wallet object above
    { upsert: true } // updates/inserts the document if it does or doesnt exist
  );
  
  return wallet;
}

/**
 * Retrieve a wallet by its address
 */
export async function getWalletByAddress(address: string): Promise<Wallet | null> {
  const client = await clientPromise;
  const db = client.db("cached_tokens");
  
  return await db.collection('blockchain_data').findOne<Wallet>({ address });
}