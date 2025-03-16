// Database model for wallet storage functionality
import clientPromise from '../lib/db';
import { ObjectId, Db } from 'mongodb';

// NEED TO MOVE THIS TO THE TYPES FILE AT SOME POINT (MAYBE, NOT THE END OF THE WORLD IF I FORGET)
export interface StoredWallet {
  _id?: ObjectId; // MongoDB document ID (optional for new records)
  wallet: string; // The blockchain wallet address
  name: string; // User-defined friendly name for the wallet
  tags: string; // Comma-separated list of categorization tags
}

async function getWalletCollection() {
  const client = await clientPromise; // Connect to MongoDB
  const db = client.db("wallets"); // Select the wallets database
  return db.collection('solana'); // Return the solana collection
}

/**
 * Retrieves all stored wallets from the database
 * @returns Array of wallet records with string IDs
 */
export const getStoredWallets = async () => {
  try {
    const collection = await getWalletCollection();
    const wallets = await collection.find({}).toArray(); // Get all "documents" (wallets) as an array
    
    // Convert MongoDB ObjectId to string format for client-side use
    return wallets.map(wallet => ({
      ...wallet,
      _id: wallet._id.toString() // Make sure _id is a string for JSON serialization
    }));
  } catch (error) {
    console.error('Error fetching wallets:', error);
    throw error;
  }
};

/**
 * Creates a new wallet record in the database
 * @param data Object containing wallet address, name and tags
 * @returns The created wallet document with its new ID
 */
export async function addStoredWallet(data: { wallet: string; name: string; tags: string }): Promise<StoredWallet> {
  // Prepare wallet document from input data
  const storedWallet: StoredWallet = {
    wallet: data.wallet,
    name: data.name,
    tags: data.tags
  };
  
  const collection = await getWalletCollection();
  const result = await collection.insertOne(storedWallet);  // Insert document
  
  // Return the created wallet with its generated ID
  return { 
    _id: result.insertedId, 
    ...storedWallet 
  };
}

/**
 * Updates an existing wallet record in the database
 * @param id MongoDB ObjectId of the wallet to update
 * @param data Updated wallet information
 * @returns Boolean indicating whether update was successful
 */
export async function updateStoredWallet(id: string, data: { wallet: string; name: string; tags: string }): Promise<boolean> {
  const collection = await getWalletCollection();
  
  // Update document matching the ID with new data
  const result = await collection.updateOne(
    { _id: new ObjectId(id) }, // Convert string ID to MongoDB ObjectId
    { $set: data } // Set the new field values
  );
  
  // Return true if a document was modified, false otherwise
  return result.modifiedCount > 0;
}

/**
 * Deletes a wallet record from the database
 * @param id MongoDB ObjectId of the wallet to delete (as string)
 * @returns Boolean indicating whether deletion was successful
 */
export async function deleteStoredWallet(id: string): Promise<boolean> {
  const collection = await getWalletCollection();
  
  // Delete document matching the ID
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  
  // Return true if a document was deleted, false otherwise
  return result.deletedCount > 0;
}