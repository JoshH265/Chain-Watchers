import { Request, Response } from 'express';
import { getWalletTransactionHistory } from '../services/transaction-history-service';

/**
 * Get transaction history for a wallet
 */
export async function getTransactionHistory(req: Request, res: Response) {
  try {
    const { address } = req.params;
    const { limit, before, after, cursor } = req.query;
    
    const result = await getWalletTransactionHistory(address, {
      limit: limit ? parseInt(limit as string) : undefined,
      before: before as string | undefined,
      after: after as string | undefined,
      cursor: cursor as string | undefined
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error in getTransactionHistory controller:', error);
    res.status(500).json({
      error: 'Failed to fetch transaction history',
      message: (error as Error).message
    });
  }
}