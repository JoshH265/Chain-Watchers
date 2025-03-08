// server/src/models/stored-wallet.model.ts
import clientPromise from '../lib/db';
import { ObjectId, Db } from 'mongodb';

export interface StoredWallet {
  _id?: ObjectId;
  wallet: string;  // The wallet address
  name: string;    // User-defined name
  tags: string;    // Comma-separated tags
}

// Helper function to get the database and collection
async function getWalletCollection() {
  const client = await clientPromise;
  const db = client.db("wallets");
  return db.collection('solana');
}

export const getStoredWallets = async () => {
  try {
    const collection = await getWalletCollection();
    const wallets = await collection.find({}).toArray();
    // Convert MongoDB ObjectId to string format if needed
    return wallets.map(wallet => ({
      ...wallet,
      _id: wallet._id.toString() // This ensures _id is a string
    }));
  } catch (error) {
    console.error('Error fetching wallets:', error);
    throw error;
  }
};

export async function addStoredWallet(data: { wallet: string; name: string; tags: string }): Promise<StoredWallet> {
  const storedWallet: StoredWallet = {
    wallet: data.wallet,
    name: data.name,
    tags: data.tags
  };
  
  const collection = await getWalletCollection();
  const result = await collection.insertOne(storedWallet);
  return { 
    _id: result.insertedId, 
    ...storedWallet 
  };
}

export async function updateStoredWallet(id: string, data: { wallet: string; name: string; tags: string }): Promise<boolean> {
  const collection = await getWalletCollection();
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: data }
  );
  
  return result.modifiedCount > 0;
}

export async function deleteStoredWallet(id: string): Promise<boolean> {
  const collection = await getWalletCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}