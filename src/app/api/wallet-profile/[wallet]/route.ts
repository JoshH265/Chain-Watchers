import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { wallet: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db('wallets');
    const walletAddress = params.wallet;

    const wallet = await db.collection('solana').findOne(
      { wallet: walletAddress },
      { projection: { wallet: 1, name: 1, tags: 1 } }
    );

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(wallet);
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet' },
      { status: 500 }
    );
  }
}