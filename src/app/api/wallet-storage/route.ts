import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('wallets');

    const wallets = await db.collection('solana')
      .find({}, { projection: { wallet: 1, name: 1, tags: 1 } })
      .toArray();

    return NextResponse.json(wallets);
  } catch (error) {
    console.error('Error fetching wallets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallets' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('wallets');
    const data = await request.json();

    const result = await db.collection('solana').insertOne({
      wallet: data.wallet,
      name: data.name,
      tags: data.tags,
      createdAt: new Date()
    });

    return NextResponse.json({
      message: 'Wallet added successfully',
      id: result.insertedId
    });
  } catch (error) {
    console.error('Error adding wallet:', error);
    return NextResponse.json(
      { error: 'Failed to add wallet' },
      { status: 500 }
    );
  }
}