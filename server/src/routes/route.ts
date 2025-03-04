import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { ObjectId } from 'mongodb';

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

export async function DELETE(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('wallets');
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('id');

    console.log('Received walletId:', walletId); // Log the walletId

    if (!walletId) {
      return NextResponse.json(
        { error: 'Wallet ID is required' },
        { status: 400 }
      );
    }

    const result = await db.collection('solana').deleteOne({ _id: new ObjectId(walletId) });

    console.log('Delete result:', result); // Log the result of the delete operation

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Wallet removed successfully' });
  } catch (error) {
    console.error('Error removing wallet:', error);
    return NextResponse.json(
      { error: 'Failed to remove wallet' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('wallets');
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('id');

    console.log('Received walletId:', walletId); // Log the walletId

    if (!walletId) {
      return NextResponse.json(
        { error: 'Wallet ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const result = await db.collection('solana').updateOne(
      { _id: new ObjectId(walletId) },
      { $set: { wallet: data.wallet, name: data.name, tags: data.tags, updatedAt: new Date() } }
    );

    console.log('Update result:', result); // Log the result of the update operation

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Wallet updated successfully' });
  } catch (error) {
    console.error('Error updating wallet:', error);
    return NextResponse.json(
      { error: 'Failed to update wallet' },
      { status: 500 }
    );
  }
}