import clientPromise from '../lib/db';

export async function getWalletData(params: any) {
  const client = await clientPromise;
  const db = client.db();
  const result = await db.collection('wallets').findOne({ /* query */ });
  return result;
}