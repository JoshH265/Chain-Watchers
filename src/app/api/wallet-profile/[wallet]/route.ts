// src/app/api/wallet-profile/[wallet]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { getWalletData, getTokenMetadata } from '../../wallet-search/route';
import { Token, TokenMetadata, TokenWithDetails } from '@/app/types';

export async function GET(
   request: NextRequest,
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

       const { solBalance, tokens: activeTokens } = await getWalletData(walletAddress);

       let tokensWithDetails: TokenWithDetails[] = [];
       if (activeTokens.length > 0) {
           const mintAddresses = activeTokens.map((token: Token) => token.mint);
           const metadata = await getTokenMetadata(mintAddresses);

           tokensWithDetails = activeTokens
               .filter((token: Token) => {
                   const balance = token.amount / Math.pow(10, token.decimals);
                   return balance > 1;
               })
               .map((token: Token) => {
                   const tokenMetadata = metadata?.find(
                       (meta: TokenMetadata) => meta?.id === token.mint
                   );

                   return {
                       mint: token.mint,
                       tokenName: tokenMetadata?.content?.metadata?.name || 
                               tokenMetadata?.content?.json?.name ||
                               'Unknown',
                       tokenSymbol: tokenMetadata?.content?.metadata?.symbol || 
                                 tokenMetadata?.content?.json?.symbol ||
                                 '???',
                       balance: parseFloat((token.amount / Math.pow(10, token.decimals)).toFixed(2)),
                       decimals: token.decimals
                   };
               });
       }

       return NextResponse.json({ ...wallet, solBalance, tokens: tokensWithDetails });
   } catch (error) {
       console.error('Error fetching wallet:', error);
       return NextResponse.json(
           { error: 'Failed to fetch wallet' },
           { status: 500 }
       );
   }
}